'use client';

import { createI18n} from 'zustic/i18n';

type DataType = {
  welcome: string;
  login: string;
};

const useTranslation = createI18n<DataType, 'bn' | 'en'>({
  initialLan: 'bn',
  async resource(lan) {
    await new Promise((res) => {
      setTimeout(() => {
        res(true)
      }, 1000);
    })
    const data = {
      en :{
        welcome:"welcome",
        login:"login",
      },
      bn :{
        welcome:"welcomebn",
        login:"loginbn",
      }
    }
    return data[lan]
  }
});


export default function I18() {
  const {isInitialLoading, isUpdating} = useTranslation();

  if (isInitialLoading) {
    return <p>Loading translations...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🌐 Language: {useTranslation.i18n.lan}</h2>

      {/* Language Switch */}
      <button onClick={() => useTranslation.i18n.updateTranslation('en')}>English</button>
      <button onClick={() => useTranslation.i18n.updateTranslation('bn')}>বাংলা</button>
      <button onClick={() => useTranslation.i18n.reload()}>reload</button>

      {isUpdating && <p>🔄 Updating...</p>}

      <hr />

      {/* Translations */}
       <p><b>Name:</b> {useTranslation.i18n.t('welcome')}</p>
      <p><b>Email:</b> {useTranslation.i18n.t('login')}</p>

      <p onClick={() => useTranslation.i18n.reload()}>Reload</p>
      {/* <h3>🏫 School</h3>

      <h3>👨‍🎓 Student</h3>
      <p>{t('school.student.name')}</p>

      <h3>📘 Subject</h3>
      <p>Name: {t('school.student.subject.name')}</p>
      <p>Code: {i18n.t('school.student.subject.code')}</p> */}
    </div>
  );
}