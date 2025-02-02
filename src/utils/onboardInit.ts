import { createEthereumProvider } from "./ethereum";
import getOnboard from "./Onboarding";
import { StateAction } from "../state/action";

import { Dispatch } from "react";
import { API } from "bnc-onboard/dist/src/interfaces";

const onboardInit = async (dispatch: Dispatch<StateAction>): Promise<API> => {
  return await getOnboard({
    address: async (address) => {
      dispatch({
        type: "SET_ADDRESS",
        payload: address,
      });
      const currentAddress = localStorage.getItem("selectedAddress");
      if (currentAddress && currentAddress !== address) {
        location.reload();
      }
      localStorage.setItem("selectedAddress", address);
    },
    network: (network) => {
      dispatch({
        type: "SET_NETWORK",
        payload: network,
      });
      const currentNetwork = localStorage.getItem("selectedNetwork");
      if (currentNetwork && Number(currentNetwork) !== network) {
        location.reload();
      }
      localStorage.setItem("selectedNetwork", network.toString());
    },
    balance: (balance) => {
      dispatch({
        type: "SET_BALANCE",
        payload: balance,
      });
    },
    wallet: async (wallet) => {
      const web3 = wallet?.provider && createEthereumProvider(wallet.provider);
      wallet.name && wallet?.provider?.selectedAddress
        ? localStorage.setItem("selectedWallet", wallet.name)
        : localStorage.removeItem("selectedWallet");

      dispatch({
        type: "SET_WALLET",
        payload: wallet,
      });
      dispatch({
        type: "SET_WEB3",
        payload: web3,
      });
      dispatch({ type: "recreateplugins" });
    },
  });
};

export default onboardInit;
