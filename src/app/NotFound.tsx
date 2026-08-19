import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="notfound">
      <h1>404</h1>
      <p>Хуудас олдсонгүй.</p>
      <Link to="/home">Нүүр хуудас руу буцах</Link>
    </div>
  );
}
