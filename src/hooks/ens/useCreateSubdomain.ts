import { ENS_REGISTRY, FIFS_REGISTRARS, MAIN_DOMAIN } from "../../constants";
import { useStateValue } from "../../state/state";
import { utf8ToKeccak256 } from "../../utils/hash";
import { sendTransaction } from "../../utils/ethereum";

import { ethers } from "ethers";
import { useCallback, useState } from "react";
import { namehash } from "ethers/lib/utils";

const contentHash = require("content-hash"); // eslint-disable-line
export const MAIN_DOMAIN_NAMEHASH = namehash(MAIN_DOMAIN);

export const useCreateSubdomain = () => {
  const [{ dapp }] = useStateValue();
  const [error, setError] = useState<any>(); // eslint-disable-line
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(0);
  const [data, setData] = useState<ethers.providers.TransactionReceipt>();

  const execute = useCallback(
    async (subdomain: string, ipfs: string) => {
      setIsLoading(true);

      const domain = `${subdomain}.${MAIN_DOMAIN}`;
      const domainNode = namehash(domain);

      try {
        if (!dapp.web3) {
          throw new Error("No web3 provider set");
        }

        const web3: ethers.providers.JsonRpcProvider = dapp.web3;
        const signerAddress = await web3.getSigner().getAddress();
        const publicResolverAddress = await web3
          .getSigner()
          .resolveName("resolver.eth");

        setStatus(0);

        await sendTransaction(
          FIFS_REGISTRARS[dapp.network],
          "function register(bytes32 label, address owner) external",
          [utf8ToKeccak256(subdomain), signerAddress],
          web3
        );

        setStatus(1);

        const resolverTx = await sendTransaction(
          ENS_REGISTRY,
          "function setResolver(bytes32 node, address owner)",
          [domainNode, publicResolverAddress],
          web3
        );

        setStatus(2);

        if (ipfs !== "") {
          const contentHashTx = await sendTransaction(
            publicResolverAddress,
            "function setContenthash(bytes32 node, bytes hash)",
            [
              domainNode,
              "0x" + contentHash.fromIpfs(ipfs),
              {
                gasLimit: 5000000,
              },
            ],
            web3
          );

          setStatus(3);
          setData(contentHashTx);
        } else {
          setData(resolverTx);
        }
      } catch (e) {
        setError(e);
      }

      setIsLoading(false);
    },
    [dapp.web3]
  );

  return [execute, { error, isLoading, status, data }] as const;
};

export default useCreateSubdomain;
