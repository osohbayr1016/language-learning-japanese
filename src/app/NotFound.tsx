import { Link, useLocation } from 'react-router-dom';

/**
 * A real page, not a stub — this is what a stale bookmark, a mistyped URL or an
 * old shared link lands on, and it was previously a bare "404" with an
 * underlined text link and no way back into the app.
 */
export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="notfound">
      <div className="notfound__mark" aria-hidden="true">
        <span>404</span>
      </div>

      <h1 className="notfound__title">Хуудас олдсонгүй</h1>
      <p className="notfound__body">
        Хайсан хуудас байхгүй эсвэл нэр нь өөрчлөгдсөн байна.
      </p>
      <p className="notfound__path" aria-label="Хүсэлт илгээсэн хаяг">
        <code>{pathname}</code>
      </p>

      <div className="notfound__actions">
        <Link className="notfound__btn notfound__btn--primary" to="/home">
          Нүүр хуудас
        </Link>
        <Link className="notfound__btn" to="/study">
          Хичээл үзэх
        </Link>
      </div>
    </div>
  );
}
