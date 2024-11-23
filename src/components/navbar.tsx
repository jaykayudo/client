"use client";

import {
  InjectedConnector,
  useAccount,
  useConnect,
  useDisconnect,
  useProvider,
  useSwitchChain,
} from "@starknet-react/core";
import { useAtom, useSetAtom } from "jotai";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { constants, num, RpcProvider } from "starknet";
import {
  connect,
  ConnectOptionsWithConnectors,
  disconnect,
  StarknetkitConnector,
} from "starknetkit";
import {
  ArgentMobileConnector,
  isInArgentMobileAppBrowser,
} from "starknetkit/argentMobile";
import { WebWalletConnector } from "starknetkit/webwallet";

import { toast } from "@/hooks/use-toast";
import { cn, shortAddress } from "@/lib/utils";
import {
  lastWalletAtom,
  providerAtom,
  userAddressAtom,
} from "@/store/common.store";
import { DASHBOARD_URL, NETWORK } from "../../constants";
import { Icons } from "./Icons";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useSidebar } from "./ui/sidebar";

export const CONNECTOR_NAMES = ["Braavos", "Argent X", "Argent (mobile)"];

export function getConnectors(isMobile: boolean) {
  const mobileConnector = ArgentMobileConnector.init({
    options: {
      dappName: "Endurfi",
      url: window.location.hostname,
      chainId: constants.NetworkName.SN_MAIN,
    },
    inAppBrowserOptions: {},
  }) as StarknetkitConnector;

  const argentXConnector = new InjectedConnector({
    options: {
      id: "argentX",
      name: "Argent X",
    },
  });

  const braavosConnector = new InjectedConnector({
    options: {
      id: "braavos",
      name: "Braavos",
    },
  });

  const webWalletConnector = new WebWalletConnector({
    url: "https://web.argent.xyz",
  }) as StarknetkitConnector;

  const isMainnet = NETWORK === constants.NetworkName.SN_MAIN;
  if (isMainnet) {
    if (isInArgentMobileAppBrowser()) {
      return [mobileConnector];
    } else if (isMobile) {
      return [mobileConnector, webWalletConnector];
    }
    return [
      argentXConnector,
      braavosConnector,
      mobileConnector,
      webWalletConnector,
    ];
  }
  return [argentXConnector, braavosConnector];
}

const Navbar = ({ className }: { className?: string }) => {
  const { address, connector, chainId } = useAccount();
  const { provider } = useProvider();
  const { connect: connectSnReact } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const pathname = usePathname();

  const [__, setAddress] = useAtom(userAddressAtom);
  const [_, setLastWallet] = useAtom(lastWalletAtom);

  const setProvider = useSetAtom(providerAtom);

  const { isMobile } = useSidebar();

  const connectorConfig: ConnectOptionsWithConnectors = useMemo(() => {
    return {
      modalMode: "canAsk",
      modalTheme: "light",
      webWalletUrl: "https://web.argent.xyz",
      argentMobileOptions: {
        dappName: "Endur.fi",
        chainId: NETWORK,
        url: window.location.hostname,
      },
      dappName: "Endur.fi",
      connectors: getConnectors(isMobile) as StarknetkitConnector[],
    };
  }, [isMobile]);

  const requiredChainId = useMemo(() => {
    return NETWORK == constants.NetworkName.SN_MAIN
      ? constants.StarknetChainId.SN_MAIN
      : constants.StarknetChainId.SN_SEPOLIA;
  }, []);

  const { switchChain, error } = useSwitchChain({
    params: {
      chainId: requiredChainId,
    },
  });

  async function connectWallet(config = connectorConfig) {
    try {
      const { connector } = await connect(config);

      if (connector) {
        connectSnReact({ connector: connector as any });
      }
    } catch (error) {
      console.error("connectWallet error", error);
    }
  }

  // switch chain if not on the required chain
  React.useEffect(() => {
    if (
      chainId &&
      chainId.toString() !== num.getDecimalString(requiredChainId)
    ) {
      switchChain();
    }
  }, [chainId]);

  React.useEffect(() => {
    if (error) {
      console.error("switchChain error", error);
    }
  }, [error]);

  // attempt to connect wallet on load
  React.useEffect(() => {
    const config = connectorConfig;
    connectWallet({
      ...config,
      modalMode: "neverAsk",
    });
  }, []);

  React.useEffect(() => {
    if (connector) {
      const name: string = connector.name;
      setLastWallet(name);
    }
  }, [connector]);

  React.useEffect(() => {
    // autoConnect();
    setAddress(address);
    setProvider(provider as RpcProvider);
  }, [address, provider]);

  // React.useEffect(() => {
  //   autoConnect();
  // }, [lastWallet]);

  return (
    <div
      className={cn(
        "flex h-20 w-full items-center justify-end",
        {
          "justify-between": isMobile,
        },
        className,
      )}
    >
      {isMobile && (
        <Sheet>
          <div className="flex items-center justify-center gap-4">
            <SheetTrigger>
              <Icons.hamburger className="size-5" />
            </SheetTrigger>
            <Image src={"/logo.png"} alt="Endur" width={28} height={28} />
          </div>

          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="bg-sidebar p-0 text-sidebar-foreground"
            side="left"
          >
            <div className="h-full border border-[#AACBC480]">
              <div className="flex items-center justify-center bg-[#AACBC433] py-10">
                <Image src={"/logo.png"} alt="Endur" width={63} height={63} />
              </div>

              <div className="h-full space-y-1 bg-[#AACBC433] px-4 pt-5">
                <Link
                  href="/"
                  className="group/stake flex cursor-pointer flex-row items-center gap-2 rounded-md bg-[#17876D] px-3 py-2 text-xl text-white transition-all"
                >
                  {pathname === "/" ? (
                    <Icons.stakingLight className="size-5" />
                  ) : (
                    <>
                      <Icons.stakingDark className="size-5 group-hover/stake:hidden" />
                      <Icons.stakingLight className="hidden size-5 group-hover/stake:flex" />
                    </>
                  )}
                  Staking
                </Link>

                <Link
                  href={DASHBOARD_URL}
                  className="group flex cursor-pointer flex-row items-center gap-2 rounded-md px-3 py-2 text-xl text-[#03624C] transition-all hover:bg-[#17876D] hover:text-white"
                >
                  <Icons.dashboardDark className="size-5 group-hover/dash:hidden" />
                  <Icons.dashboardLight className="hidden size-5 group-hover/dash:flex" />
                  Dashboard
                </Link>

                <Link
                  href="/defi"
                  className="group/defi flex cursor-pointer flex-row items-center gap-2 rounded-md bg-[#17876D] px-3 py-2 text-xl text-white transition-all"
                >
                  {pathname === "/defi" ? (
                    <Icons.defiLight className="size-5" />
                  ) : (
                    <>
                      <Icons.defiDark className="size-5 group-hover/defi:hidden" />
                      <Icons.defiLight className="hidden size-5 group-hover/defi:flex" />
                    </>
                  )}
                  DEfi
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="flex items-center gap-4">
        <button
          className={cn(
            "flex h-10 items-center justify-center gap-2 rounded-lg border border-[#ECECED80] bg-[#AACBC433] text-sm font-bold text-[#03624C] focus-visible:outline-[#03624C]",
            {
              "h-[34px]": isMobile,
            },
          )}
          onClick={() => !address && connectWallet()}
        >
          {!address && (
            <p
              className={cn(
                "relative flex w-[9.5rem] select-none items-center justify-center gap-1 bg-transparent text-sm",
              )}
            >
              Connect Wallet
            </p>
          )}

          {address && (
            <>
              {!isMobile ? (
                <div className="flex w-[9.5rem] items-center justify-center gap-2">
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      toast({
                        description: "Address copied to clipboard",
                      });
                    }}
                    className="flex h-9 items-center justify-center gap-2 rounded-md"
                  >
                    <Icons.gradient />
                    <p className="flex items-center gap-1 text-sm">
                      {address && shortAddress(address, 4, 4)}
                    </p>
                  </div>

                  <X
                    onClick={() => (disconnect(), disconnectAsync())}
                    className="size-4 text-[#3F6870]"
                  />
                </div>
              ) : (
                <div className="flex w-[9.5rem] items-center justify-center gap-2">
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      toast({ description: "Address copied to clipboard" });
                    }}
                    className="flex w-fit items-center justify-center gap-2 rounded-md"
                  >
                    <Icons.wallet className="size-5 text-[#3F6870]" />
                    {shortAddress(address, 4, 4)}
                  </div>

                  <X
                    onClick={() => (disconnect(), disconnectAsync())}
                    className="size-4 text-[#3F6870]"
                  />
                </div>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Navbar;
