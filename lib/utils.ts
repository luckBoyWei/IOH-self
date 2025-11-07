import classNames from '@/utils/classnames'

export function cn(...inputs: any[]) {
  // delegate to project's classnames + tailwind-merge utility
  return classNames(...inputs)
}

export default cn
