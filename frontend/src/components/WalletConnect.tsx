import { ConnectButton, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { Wallet, LogOut } from "lucide-react";

export function WalletConnect() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  return (
    <div className="flex items-center gap-4">
      {account ? (
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
          <Wallet className="w-5 h-5 text-purple-400" />
          <span className="text-white font-medium">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
          <button
            onClick={() => disconnect()}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <ConnectButton />
      )}
    </div>
  );
}
