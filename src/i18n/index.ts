'use client';

import { create as c } from 'core';
import { useEffect} from 'react';
import type { I18nInstance, I18nParams, StoreType, TranslationKey } from './type';


function createI18n<T = any, L = any>(params: I18nParams<T, L>) {
  const { resource, initialLan } = params;

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

  // Reads the store directly (not via the useStore() hook), so this works
  // outside React too - e.g. from a plain module like a toast/message
  // helper where hooks aren't available. Shared by both the standalone
  // `i18n` object below and the `useTranslation()` hook's `t`.
  function translate(key: TranslationKey<T>): string {
    const { data, isInitialLoading } = useStore.getState();
    if (!data || isInitialLoading) return "";
    return (key.split('.').reduce((acc: any, part) => acc?.[part], data) ?? key);
  }

  // Non-hook API for use outside React components/hooks. Every member reads
  // live from the store (via getState()) rather than a fixed snapshot, so it
  // always reflects the current language/data - unlike a plain object
  // literal captured once at createI18n() call time.
  const i18n: I18nInstance<T, L> = {
    t: translate,
    get lan() {
      return useStore.getState().lan;
    },
    async reload() {
      const { lan, load } = useStore.getState();
      await load(lan);
    },
    updateTranslation(lang: L) {
      useStore.getState().update(lang);
    },
  };

  function useTranslation() {
    const {lan, update, isUpdating, isInitialLoading , load} = useStore();

    useEffect(() => {
      load(lan);
    }, [lan]);

    function updateTranslation(lang: L) {
      update(lang);
    }

    async function reload () {
      await load(lan)
    }

    return {
      reload,
      t: translate,
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




