// System Alert Service for critical notifications and real-time alerts
import { supabase } from '@/integrations/supabase/client';

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical';
export type AlertCategory = 
  | 'system' 
  | 'security' 
  | 'payment' 
  | 'project' 
  | 'bid' 
  | 'milestone' 
  | 'verification'
  | 'workflow';

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: AlertCategory;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  persistent?: boolean;
}

export interface AlertConfig {
  showToast?: boolean;
  showBanner?: boolean;
  playSound?: boolean;
  sendPush?: boolean;
  persist?: boolean;
}

type AlertSubscriber = (alert: SystemAlert) => void;

class SystemAlertServiceClass {
  private subscribers: Set<AlertSubscriber> = new Set();
  private activeAlerts: Map<string, SystemAlert> = new Map();
  private alertHistory: SystemAlert[] = [];
  private maxHistorySize = 100;

  // Subscribe to system alerts
  subscribe(callback: AlertSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers
  private notifySubscribers(alert: SystemAlert): void {
    this.subscribers.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('[SystemAlert] Subscriber error:', error);
      }
    });
  }

  // Create and dispatch a system alert
  async createAlert(
    title: string,
    message: string,
    severity: AlertSeverity,
    category: AlertCategory,
    options: {
      actionUrl?: string;
      metadata?: Record<string, any>;
      expiresIn?: number; // milliseconds
      config?: AlertConfig;
    } = {}
  ): Promise<SystemAlert> {
    const alert: SystemAlert = {
      id: crypto.randomUUID(),
      title,
      message,
      severity,
      category,
      timestamp: new Date(),
      read: false,
      actionUrl: options.actionUrl,
      metadata: options.metadata,
      expiresAt: options.expiresIn 
        ? new Date(Date.now() + options.expiresIn) 
        : undefined,
      persistent: options.config?.persist ?? severity === 'critical'
    };

    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.addToHistory(alert);

    // Notify subscribers
    this.notifySubscribers(alert);

    // Handle expiration
    if (alert.expiresAt && !alert.persistent) {
      const timeout = alert.expiresAt.getTime() - Date.now();
      setTimeout(() => {
        this.dismissAlert(alert.id);
      }, timeout);
    }

    return alert;
  }

  // Pre-defined alert creators for common scenarios
  async projectStatusChanged(
    projectId: string,
    projectTitle: string,
    newStatus: string,
    actionUrl?: string
  ): Promise<SystemAlert> {
    return this.createAlert(
      'Project Status Updated',
      `${projectTitle} is now ${newStatus}`,
      'info',
      'project',
      { actionUrl: actionUrl || `/citizen/projects`, metadata: { projectId, newStatus } }
    );
  }

  async bidReceived(
    reportId: string,
    reportTitle: string,
    contractorName: string
  ): Promise<SystemAlert> {
    return this.createAlert(
      'New Bid Received',
      `${contractorName} submitted a bid for "${reportTitle}"`,
      'info',
      'bid',
      { actionUrl: `/government/bid-approval`, metadata: { reportId, contractorName } }
    );
  }

  async bidSelected(
    projectTitle: string,
    isWinner: boolean
  ): Promise<SystemAlert> {
    return this.createAlert(
      isWinner ? 'Bid Selected!' : 'Bid Not Selected',
      isWinner 
        ? `Congratulations! Your bid for "${projectTitle}" was selected`
        : `Your bid for "${projectTitle}" was not selected`,
      isWinner ? 'success' : 'info',
      'bid',
      { actionUrl: '/contractor/tracking' }
    );
  }

  async paymentReleased(
    projectTitle: string,
    amount: number,
    milestone: string
  ): Promise<SystemAlert> {
    return this.createAlert(
      'Payment Released',
      `KES ${amount.toLocaleString()} released for ${milestone} on "${projectTitle}"`,
      'success',
      'payment',
      { actionUrl: '/contractor/financials', metadata: { amount, milestone } }
    );
  }

  async milestoneCompleted(
    projectTitle: string,
    milestoneName: string
  ): Promise<SystemAlert> {
    return this.createAlert(
      'Milestone Completed',
      `${milestoneName} completed for "${projectTitle}"`,
      'success',
      'milestone',
      { actionUrl: '/citizen/projects' }
    );
  }

  async verificationRequired(
    projectTitle: string,
    milestoneName: string,
    projectId: string
  ): Promise<SystemAlert> {
    return this.createAlert(
      'Verification Needed',
      `Please verify ${milestoneName} for "${projectTitle}"`,
      'warning',
      'verification',
      { actionUrl: `/citizen/projects`, metadata: { projectId } }
    );
  }

  async securityAlert(
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<SystemAlert> {
    return this.createAlert(
      title,
      message,
      'critical',
      'security',
      { metadata, config: { persist: true, sendPush: true } }
    );
  }

  async workflowUpdate(
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<SystemAlert> {
    return this.createAlert(
      title,
      message,
      'info',
      'workflow',
      { actionUrl }
    );
  }

  // Get all active alerts
  getActiveAlerts(): SystemAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => {
        if (alert.expiresAt && new Date() > alert.expiresAt) {
          this.activeAlerts.delete(alert.id);
          return false;
        }
        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get unread count
  getUnreadCount(): number {
    return this.getActiveAlerts().filter(a => !a.read).length;
  }

  // Mark alert as read
  markAsRead(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.read = true;
      this.activeAlerts.set(alertId, alert);
    }
  }

  // Mark all alerts as read
  markAllAsRead(): void {
    this.activeAlerts.forEach((alert, id) => {
      alert.read = true;
      this.activeAlerts.set(id, alert);
    });
  }

  // Dismiss an alert
  dismissAlert(alertId: string): void {
    this.activeAlerts.delete(alertId);
    this.notifySubscribers({
      id: alertId,
      title: '',
      message: '',
      severity: 'info',
      category: 'system',
      timestamp: new Date(),
      read: true,
      metadata: { dismissed: true }
    });
  }

  // Clear all non-persistent alerts
  clearAlerts(): void {
    const persistentAlerts = new Map<string, SystemAlert>();
    this.activeAlerts.forEach((alert, id) => {
      if (alert.persistent) {
        persistentAlerts.set(id, alert);
      }
    });
    this.activeAlerts = persistentAlerts;
  }

  // Get alert history
  getHistory(): SystemAlert[] {
    return [...this.alertHistory];
  }

  // Add to history
  private addToHistory(alert: SystemAlert): void {
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize);
    }
  }

  // Get alerts by category
  getAlertsByCategory(category: AlertCategory): SystemAlert[] {
    return this.getActiveAlerts().filter(a => a.category === category);
  }

  // Get alerts by severity
  getAlertsBySeverity(severity: AlertSeverity): SystemAlert[] {
    return this.getActiveAlerts().filter(a => a.severity === severity);
  }
}

export const SystemAlertService = new SystemAlertServiceClass();
