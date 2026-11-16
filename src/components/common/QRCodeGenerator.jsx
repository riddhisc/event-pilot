import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const QRCodeGenerator = ({ data, label = 'Contact QR code' }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) return undefined;
    let active = true;
    QRCode.toDataURL(JSON.stringify({
      id: data.id,
      name: data.name,
      email: data.email || '',
      title: data.title || '',
      department: data.department || '',
    }), { errorCorrectionLevel: 'M', margin: 1, width: 220 })
      .then((url) => {
        if (active) setQrCodeUrl(url);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [data]);

  if (error) return <p className="error-message" role="alert">{error}</p>;
  if (!qrCodeUrl) return <p>Generating QR code...</p>;

  return (
    <figure className="qrcode-container">
      <img src={qrCodeUrl} alt={label} width="220" height="220" />
      <figcaption>
        <strong>{data.name}</strong>
        <p>{data.title}</p>
        <p>{data.department}</p>
      </figcaption>
    </figure>
  );
};

export default QRCodeGenerator;
