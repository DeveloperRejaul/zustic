'use client';

import { create as c } from 'core';
import type { I18nParams, StoreType, TranslationKey } from './types';

function create<T = any, L = any>(params: I18nParams<T, L>) {
  const { resorce, initialLan } = params;
  let data = null as T

  const useStore = c<StoreType<T,L>>((set) => ({
    lan: initialLan,
    update: (lan: L) => {
       set({lan})
    },
  }));

  // Initially load translations
  (async () => {
    data = await Promise.resolve(resorce(initialLan));
  })();

  return function useTranslation() {
    const { lan, update } = useStore();

    function t(key: TranslationKey<T>): string {
      if (!data) return key;
      console.log('call');
      console.log(key);
      console.log(data);

      return key.split('.').reduce((acc: any, part) => acc?.[part], data);
    }

    function updateTranslation(lang: L) {
       update(lang);
    }

    return {
      t,
      lan,
      updateTranslation,
    };
  };
}

export { create };