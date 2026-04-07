import {create} from 'zustic/i18n';


type DataType = {
    name:string;
    email:string;
    school:{
        name:string;
        email:string;
        student: {
            name: string;
            email: string;
            subject :{
                name:string,
                code:string
            }
        }
    }
}

const useTransolate = create<DataType, "bn" | 'en'>({
    initialLan:'bn',
    async resorce() {
      const res:DataType = await new Promise((re)=>{
        setTimeout(() => {
            re({
                name:"rezaul",
                email:"rezaul@gmail.com",
                school:{
                    name:"rezaul",
                    email:"rezaul@gmail.com",
                    student:{
                         name:"rezaul",
                         email:"rezaul@gmail.com",
                         subject:{
                            name:"math",
                            code:"101"
                         }
                    }
                }
            })
        }, 0);
       })
       return res
    },
})


export default function I18() {
  const {t}= useTransolate()

  return (
    <div>
        <p>{t('school.student.subject.name')}</p>
    </div>
  )
}
