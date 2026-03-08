// Minimal custom error page — prevents /_error build failures in Next.js
function Error({ statusCode }) {
  return null;
}
Error.getInitialProps = ({ res, err }) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};
export default Error;
