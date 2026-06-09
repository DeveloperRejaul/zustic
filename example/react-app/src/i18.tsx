'use client';

import { createI18n} from 'zustic/i18n';

type DataType = {
  welcome: string;
  login: string;
};

const {useTranslation, i18n} = createI18n<DataType, 'bn' | 'en'>({
  initialLan: 'bn',
  async resource(lan) {
    console.log('call');
    
    const response = await fetch(
      `https://raw.githubusercontent.com/DeveloperRejaul/react-native-i18/main/locales/${lan}/common.json`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.log('faild');
      
      throw new Error(`Failed to load ${lan} locale`);
    }

    return await response.json();
  },
});


export default function I18() {
  const {isInitialLoading, isUpdating ,t,reload} = useTranslation();

  if (isInitialLoading) {
    return <p>Loading translations...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🌐 Language: {i18n.lan}</h2>

      {/* Language Switch */}
      <button onClick={() => i18n.updateTranslation('en')}>English</button>
      <button onClick={() => i18n.updateTranslation('bn')}>বাংলা</button>
      <button onClick={() => reload()}>reload</button>

      {isUpdating && <p>🔄 Updating...</p>}

      <hr />

      {/* Translations */}
       <p><b>Name:</b> {t('welcome')}</p>
      <p><b>Email:</b> {t('login')}</p>

      <p onClick={() => i18n.reload()}>Reload</p>
      {/* <h3>🏫 School</h3>

      <h3>👨‍🎓 Student</h3>
      <p>{t('school.student.name')}</p>

      <h3>📘 Subject</h3>
      <p>Name: {t('school.student.subject.name')}</p>
      <p>Code: {i18n.t('school.student.subject.code')}</p> */}
    </div>
  );
}