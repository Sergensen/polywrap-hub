import { domain } from "../../constants";
import ApiUris from "../../api/entities/apiUris";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useWeb3ApiClient } from "@web3api/react";
import { useStateValue } from "hooks";
import { networks } from "utils/networks";
import { AnyMetaManifest } from "@web3api/core-js";
import { publishFromMeta, PublishOptions } from "utils/publishFromMeta";

export interface APIDataFromManifest {
  name: string;
  description?: string;
  subtext?: string;
  icon?: string;
  apiUris?: string[];
}
export interface APIData {
  id: number;
  name: string;
  subtext: string;
  description: string;
  icon: string;
  favorites: number;
  locationUri: string;
  apiUris: ApiUris[];
}

export const useGetAPIfromENSParamInURL = () => {
  const router = useRouter();
  const [error, setError] = useState<any>(); // eslint-disable-line
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<APIData>();

  const fetchApiDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      if (router.query.uri) {
        const { data: apiData } = await axios.get<{ api: APIData }>(
          domain + `/api/apis/${router.asPath.split("uri=")[1]}`
        );

        setData(apiData.api);
      }
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [router.query.uri, router.query.customUri]);

  useEffect(() => {
    if (router.isReady) {
      void fetchApiDetails();
    }
  }, [router.isReady, router.query.uri, router.query.customUri]);
  return { error, isLoading, data, fetchApiDetails };
};

export const useGetAPIfromParamInURL = () => {
  const router = useRouter();
  const [{ dapp }] = useStateValue();
  const [error, setError] = useState<any>(); // eslint-disable-line
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<APIData | APIDataFromManifest>();
  const client = useWeb3ApiClient();

  const handleApiData = (
    meta: APIDataFromManifest,
    options: PublishOptions
  ) => {
    if (router.query.customUri) {
      void publishFromMeta(meta, options);
    }

    setData(meta as APIDataFromManifest);
  };

  const fetchApiDetails = useCallback(async () => {
    setIsLoading(true);
    if (router.query.uri || router.query.customUri) {
      const [location, uri] = String(
        router.query.uri || router.query.customUri
      ).split("/");
      const apiLocation =
        location === "ipfs"
          ? `${location}/${uri}`
          : `${location}/${networks[dapp?.network]?.name || "mainnet"}/${uri}`;

      client
        .getManifest(apiLocation, {
          type: "meta",
        })
        .then((meta: AnyMetaManifest) => {
          const { description, icon, subtext } = meta;
          const name =
            "displayName" in meta
              ? meta.displayName
              : "name" in meta
              ? meta.name
              : "";
          handleApiData(
            {
              name,
              description,
              subtext,
              icon,
              apiUris: [`${location}/${uri}`],
            },
            { location, uri, did: dapp?.did }
          );
        })
        .catch((errorMeta) => {
          client
            .getManifest(apiLocation, {
              type: "web3api",
            })
            .then((web3api) => {
              const meta: APIDataFromManifest = {
                name: web3api.name,
                description: "",
                icon: "",
                subtext: "",
                apiUris: [`${location}/${uri}`],
              };
              handleApiData(meta, { location, uri, did: dapp?.did });
            })
            .catch((errorWeb3Api) => {
              setError([errorMeta.message, errorWeb3Api.message]);
            });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [router.query.uri, router.query.customUri, dapp?.network]);

  useEffect(() => {
    if (router.isReady) {
      void fetchApiDetails();
    }
  }, [router.isReady, router.query.uri, router.query.customUri]);
  return { error, isLoading, data, fetchApiDetails };
};

export default useGetAPIfromENSParamInURL;
