import footerBg from '@/assets/layout/footer-bg.svg'
import './footer.scss'

export function Footer() {
  return (
    <div className="base-layout-footer">
      <img className="base-layout-footer__bg" src={footerBg} />
      <div className="base-layout-footer__main">
        <div className="body scrollbar-style">
          <div className="username">Guest</div>
        </div>
      </div>
    </div>
  )
}
