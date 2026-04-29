import React from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Loader2,
  TrendingUp,
  Clock,
  Hash,
} from 'lucide-react';
import { useWallet, type WalletTransaction } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { Navigate } from 'react-router-dom';
import SendByNationalIdDialog from '@/components/wallet/SendByNationalIdDialog';
import WithdrawDialog from '@/components/wallet/WithdrawDialog';
import GovernmentTreasuryActions from '@/components/government/GovernmentTreasuryActions';

const formatKES = (n: number) => `KES ${Number(n ?? 0).toLocaleString()}`;

const TX_LABEL: Record<WalletTransaction['transaction_type'], string> = {
  mint: 'Treasury Mint',
  fund_escrow: 'Escrow Funded',
  worker_payment: 'Worker Wage',
  contractor_payment: 'Contractor Payment',
  peer_transfer: 'Peer Transfer',
  withdrawal: 'Withdrawal',
  refund: 'Refund',
};

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const { wallet, transactions, isLoading } = useWallet();

  if (!user) return <Navigate to="/auth" replace />;

  const userType = (user as any).user_type || 'citizen';
  const homePath =
    userType === 'contractor' ? '/contractor' : userType === 'government' ? '/government' : '/citizen';

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: userType.charAt(0).toUpperCase() + userType.slice(1), href: homePath },
    { label: 'Wallet' },
  ];

  const isCredit = (tx: WalletTransaction) => tx.to_wallet_id === wallet?.id;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ResponsiveContainer>
        <BreadcrumbNav items={breadcrumbItems} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <WalletIcon className="w-8 h-8 text-primary" />
            My Wallet
          </h1>
          <p className="text-muted-foreground mt-1">
            Internal coin balance — 1 coin = 1 KES. Send instantly by National ID, or withdraw to
            M-Pesa or your bank.
          </p>
        </div>

        {/* Context banner: clarifies relationship to existing modules */}
        <Card className="mb-6 border-dashed bg-muted/30">
          <CardContent className="p-4 text-sm text-muted-foreground">
            {userType === 'citizen' && (
              <>
                <strong className="text-foreground">How this fits:</strong> This wallet shows your live
                coin balance from completed work. <em>My Jobs</em> still tracks job assignments and
                day-by-day records — wallet is the money side of the same activity.
              </>
            )}
            {userType === 'contractor' && (
              <>
                <strong className="text-foreground">How this fits:</strong> Wallet shows your live coin
                balance. <em>Project Financials</em> still shows per-project budgets, milestone
                payments, and escrow status — wallet is your operating cash view.
              </>
            )}
            {(userType === 'government' || userType === 'admin') && (
              <>
                <strong className="text-foreground">How this fits:</strong> The treasury wallet is the
                source of all coins. <em>Escrow</em> and <em>Escrow Funding</em> still manage per-project
                allocations; <em>Payment Audit</em> remains the immutable transaction record.
              </>
            )}
          </CardContent>
        </Card>

        {/* Balance card */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : !wallet ? (
              <div className="text-center text-muted-foreground py-6">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Setting up your wallet…
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    Available Balance
                  </p>
                  <p className="text-4xl font-bold text-primary mt-1">{formatKES(wallet.balance)}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    Wallet ID: {wallet.id.slice(0, 8)}…
                    <Badge variant="outline" className="ml-2 capitalize">
                      {wallet.wallet_type}
                    </Badge>
                  </p>
                </div>
                <div className="flex gap-2">
                  <WithdrawDialog
                    availableBalance={Number(wallet.balance)}
                    trigger={
                      <Button className="gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        Withdraw
                      </Button>
                    }
                  />
                  <SendByNationalIdDialog
                    availableBalance={Number(wallet.balance)}
                    trigger={
                      <Button variant="outline" className="gap-2">
                        <ArrowDownLeft className="w-4 h-4 rotate-180" />
                        Send
                      </Button>
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {wallet && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Received</p>
                    <p className="text-xl font-semibold mt-1">{formatKES(wallet.total_received)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sent</p>
                    <p className="text-xl font-semibold mt-1">{formatKES(wallet.total_sent)}</p>
                  </div>
                  <ArrowUpRight className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Withdrawn</p>
                    <p className="text-xl font-semibold mt-1">{formatKES(wallet.total_withdrawn)}</p>
                  </div>
                  <Coins className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Transaction History
            </CardTitle>
            <CardDescription>
              Every coin movement is recorded on the transparency ledger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <WalletIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No transactions yet.</p>
                <p className="text-xs mt-1">
                  Your activity will appear here as soon as money moves in or out.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((tx) => {
                  const credit = isCredit(tx);
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            credit
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                          }`}
                        >
                          {credit ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {TX_LABEL[tx.transaction_type] ?? tx.transaction_type}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {tx.description ?? tx.reference ?? 'Internal transfer'}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                            {(() => {
                              try {
                                return format(parseISO(tx.created_at), 'MMM d, yyyy • h:mm a');
                              } catch {
                                return tx.created_at;
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`font-semibold ${
                            credit ? 'text-green-600' : 'text-orange-600'
                          }`}
                        >
                          {credit ? '+' : '−'} {formatKES(tx.amount)}
                        </p>
                        <Badge
                          variant={tx.status === 'completed' ? 'secondary' : 'outline'}
                          className="text-[10px] mt-1"
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </ResponsiveContainer>
    </div>
  );
};

export default WalletPage;
