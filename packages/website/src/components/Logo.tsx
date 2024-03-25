import { JM_Logo } from '#assets/icons'
import { useSettingsContext } from '#contexts/SettingsContext'

export const Logo: React.FC<JSX.IntrinsicElements['div']> = ({ className = '', ...props }) => {
  const settings = useSettingsContext()

  return (
    <div {...props} className={`text-black py-6 pb-6 ${className}`}>
      {
        settings.organization?.logo_url ? (
          <img alt={`${settings.organization?.name} logo`} src={settings.organization?.logo_url} className='h-10' />
        ) : (
          <>
            <JM_Logo width={128} height={100} className='m-1 inline' aria-label='JM Meats Logo' />
          </>

        )
      }
    </div>
  )
}
