'use client';

import { create } from 'zustic/i18n';

type DataType = {
  name: string;
  email: string;
  school: {
    name: string;
    email: string;
    student: {
      name: string;
      email: string;
      subject: {
        name: string;
        code: string;
      };
    };
  };
};

const useTranslate = create<DataType, 'bn' | 'en'>({
  initialLan: 'bn',

  async resource(lan) {
    const res: DataType = await new Promise((resolve) => {
      setTimeout(() => {
        if (lan === 'bn') {
          resolve({
            name: 'রেজাউল',
            email: 'rezaul@gmail.com',
            school: {
              name: 'ঢাকা স্কুল',
              email: 'school@gmail.com',
              student: {
                name: 'শিক্ষার্থী',
                email: 'student@gmail.com',
                subject: {
                  name: 'গণিত',
                  code: '১০১',
                },
              },
            },
          });
        } else {
          resolve({
            name: 'Rezaul',
            email: 'rezaul@gmail.com',
            school: {
              name: 'Dhaka School',
              email: 'school@gmail.com',
              student: {
                name: 'Student',
                email: 'student@gmail.com',
                subject: {
                  name: 'Math',
                  code: '101',
                },
              },
            },
          });
        }
      }, 1500); // simulate delay
    });

    return res;
  },
});


export default function I18() {
  const { t, lan, updateTranslation, isInitialLoading, isUpdating } = useTranslate();

  if (isInitialLoading) {
    return <p>Loading translations...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🌐 Language: {lan}</h2>

      {/* Language Switch */}
      <button onClick={() => updateTranslation('en')}>English</button>
      <button onClick={() => updateTranslation('bn')}>বাংলা</button>

      {isUpdating && <p>🔄 Updating...</p>}

      <hr />

      {/* Translations */}
      <p><b>Name:</b> {t('name')}</p>
      <p><b>Email:</b> {t('email')}</p>

      <h3>🏫 School</h3>
      <p>{t('school.name')}</p>

      <h3>👨‍🎓 Student</h3>
      <p>{t('school.student.name')}</p>

      <h3>📘 Subject</h3>
      <p>Name: {t('school.student.subject.name')}</p>
      <p>Code: {t('school.student.subject.code')}</p>
    </div>
  );
}