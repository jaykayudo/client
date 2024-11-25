import { NextResponse } from "next/server";
import { Contract, RpcProvider } from "starknet";

import MintingAbi from "@/abi/minting.abi.json";
import StakingAbi from "@/abi/staking.abi.json";
import MyNumber from "@/lib/MyNumber";
import { getLSTContract } from "@/store/lst.store";

import {
  getProvider,
  SN_MINTING_CURVE_ADRESS,
  SN_STAKING_ADRESS,
  STRK_DECIMALS,
} from "../../../../constants";

export const revalidate = 1800;

export async function GET(_req: Request) {
  const provider = getProvider();

  if (!provider) {
    return NextResponse.json("Provider not found");
  }

  let yearlyMinting = MyNumber.fromZero();
  let totalStaked = MyNumber.fromZero();

  const mintingContract = new Contract(
    MintingAbi,
    SN_MINTING_CURVE_ADRESS,
    provider,
  );

  try {
    const res = await mintingContract.call("yearly_mint");
    yearlyMinting = new MyNumber(res.toString(), STRK_DECIMALS);
  } catch (error) {
    console.error("yearlyMintingError", error);
    return NextResponse.json({
      message: "yearlyMintingError",
      error,
    });
  }

  const stakingContract = new Contract(StakingAbi, SN_STAKING_ADRESS, provider);

  try {
    const res = await stakingContract.call("get_total_stake");
    totalStaked = new MyNumber(res.toString(), STRK_DECIMALS);
  } catch (error) {
    console.error("snTotalStakedError", error);
    return NextResponse.json({
      message: "snTotalStakedError",
      error,
    });
  }

  let apy = 0;
  if (Number(totalStaked.toEtherToFixedDecimals(0)) !== 0) {
    apy =
      Number(yearlyMinting.toEtherToFixedDecimals(4)) /
      Number(totalStaked.toEtherToFixedDecimals(4));
  }

  const apyInPercentage = (apy * 100).toFixed(2);

  try {
    const lstContract = getLSTContract(provider as RpcProvider);
    const balance = await lstContract.call("total_assets");

    const response = NextResponse.json({
      asset: "STRK",
      tvl: new MyNumber(
        balance.toString(),
        STRK_DECIMALS,
      ).toEtherToFixedDecimals(2),
      apy,
      apyInPercentage: `${apyInPercentage}%`,
    });

    return response;
  } catch (error) {
    console.error("totalStakedError", error);
    return NextResponse.json({
      message: "totalStakedError",
      error,
    });
  }
}