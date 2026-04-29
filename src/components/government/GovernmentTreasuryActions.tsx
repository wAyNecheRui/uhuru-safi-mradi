import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Building2, Wallet as WalletIcon, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import AllocateProjectFundsDialog from '@/components/wallet/AllocateProjectFundsDialog';
import SendByBusinessRegDialog from '@/components/wallet/SendByBusinessRegDialog';
import { useWallet } from '@/hooks/useWallet';

/**
 * Government Treasury quick-actions card.
 * Lives on the Government Dashboard home and Treasury Wallet page.
 */
const GovernmentTreasuryActions: React.FC = () => {
  const { wallet, refetch } = useWallet();
  const balance = Number(wallet?.balance ?? 0);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          Treasury Quick Actions
        </CardTitle>
        <CardDescription>
          Funds are auto-allocated to project escrows on bid award. Use these for manual top-ups and
          direct contractor payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Treasury balance</p>
            <p className="text-lg font-semibold">KES {balance.toLocaleString()}</p>
          </div>
          <Sparkles className="w-5 h-5 text-primary/60" />
        </div>

        <div className="grid sm:grid-cols-2 gap-2">
          <AllocateProjectFundsDialog
            onComplete={refetch}
            trigger={
              <Button className="gap-2 w-full">
                <Coins className="w-4 h-4" /> Allocate Coins
              </Button>
            }
          />
          <SendByBusinessRegDialog
            availableBalance={balance}
            onComplete={refetch}
            trigger={
              <Button variant="outline" className="gap-2 w-full">
                <Building2 className="w-4 h-4" /> Top Up Contractor
              </Button>
            }
          />
        </div>

        <Button asChild variant="ghost" className="w-full gap-2 text-muted-foreground">
          <Link to="/government/wallet">
            <WalletIcon className="w-4 h-4" /> Open Treasury Wallet
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default GovernmentTreasuryActions;
