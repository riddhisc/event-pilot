import { Link } from 'react-router-dom';

const Breadcrumbs = ({ items = [] }) => (
  <nav className="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      {items.map((crumb, index) => (
        <li key={`${crumb.label}-${index}`} className={index > 0 && index < items.length - 1 ? 'breadcrumb-middle' : ''}>
          {index > 0 && <span aria-hidden="true" className="breadcrumb-separator">/</span>}
          {crumb.to && index < items.length - 1 ? <Link to={crumb.to} title={crumb.label}>{crumb.label}</Link> : <span aria-current={index === items.length - 1 ? 'page' : undefined} title={crumb.label}>{crumb.label}</span>}
        </li>
      ))}
    </ol>
  </nav>
);

export default Breadcrumbs;
