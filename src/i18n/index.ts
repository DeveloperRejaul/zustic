'use client';

import { create as c } from 'core';
import { useEffect} from 'react';
import type { I18nInstance, I18nParams, StoreType, TranslationKey } from './type';


function createI18n<T = any, L = any>(params: I18nParams<T, L>) {
  const { resource, initialLan } = params;

  const i18n = {
    t: () => "",
    updateTranslation: () => {},
    reload: async () => {},
    lan: '',
  } as I18nInstance

  let requestId = 0; 

  const useStore = c<StoreType<T, L>>((set, get) => ({
    lan: initialLan,
    data: null as T | null,
    isUpdating: false,
    isInitialLoading: true,

    async load(lan: L) {
      const id = ++requestId;

      const isFirstLoad = get().data === null;

      set({
        isUpdating: !isFirstLoad,
        isInitialLoading: isFirstLoad,
      });

      const result = await Promise.resolve(resource(lan));

      // ignore outdated requests
      if (id !== requestId) return;

      set({
        data: result,
        isUpdating: false,
        isInitialLoading: false,
      });
    },

    update(lan: L) {
      set({ lan });
    },
  }));

  function useTranslation() {
    const {lan, data, update, isUpdating, isInitialLoading , load} = useStore();

    useEffect(() => {
      load(lan);
    }, [lan]);

    function t(key: TranslationKey<T>): string {
      if (!data || isInitialLoading) return "";
      return (key.split('.').reduce((acc: any, part) => acc?.[part], data) ?? key) ;
    }

    function updateTranslation(lang: L) {
      update(lang);
    }

    async function reload () {
      await load(lan)
    }

    return {
      reload,
      t,
      lan,
      updateTranslation,
      isUpdating,
      isInitialLoading,
    };
  };

  return Object.assign(useTranslation, {i18n})
}

export{ 
  createI18n,
};




