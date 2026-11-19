export const Loading = () => <p className="state">Loading…</p>
export const Empty = ({ text }: { text: string }) => <p className="state">{text}</p>
export const ErrorBox = ({ message }: { message: string }) => <p className="state err" role="alert">{message}</p>
