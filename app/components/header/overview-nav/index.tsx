'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import {
  RiPlanetFill,
  RiPlanetLine,
} from '@remixicon/react'
import classNames from '@/utils/classnames'
type ExploreNavProps = {
  className?: string
}

const OverviewNav = ({
  className,
}: ExploreNavProps) => {
  const { t } = useTranslation()
  const selectedSegment = useSelectedLayoutSegment()
  const activated = selectedSegment === 'overview'

  return (
    <Link href="/overview" className={classNames(
      className, 'group',
      activated && 'bg-components-main-nav-nav-button-bg-active shadow-md',
      activated ? 'text-components-main-nav-nav-button-text-active' : 'text-components-main-nav-nav-button-text hover:bg-components-main-nav-nav-button-bg-hover',
    )}>
      {
        activated
          ? <RiPlanetFill className='h-4 w-4' />
          : <RiPlanetLine className='h-4 w-4' />
      }
      <div className='ml-2 max-[1024px]:hidden'>
        {t('common.menus.overview')}
      </div>
    </Link>
  )
}

export default OverviewNav
