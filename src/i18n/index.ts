'use client';

import { create as c } from 'core';
import { useEffect} from 'react';
import type { I18nParams, StoreType, TranslationKey } from './type';

interface I18nInstance<T = any, L = any> {
  t(key: TranslationKey<T>): string
  lan: L;
  updateTranslation(lang: L): void
  reload(): Promise<void>
}

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

    // sync global object
    i18n.t = t;
    i18n.lan = lan;
    i18n.updateTranslation = updateTranslation;
    i18n.reload = reload;


    return {
      reload,
      t,
      lan,
      updateTranslation,
      isUpdating,
      isInitialLoading,
    };
  };

  return {
    useTranslation,
    i18n: i18n as I18nInstance<T, L>,
  }
}

export{ 
  createI18n,
};




