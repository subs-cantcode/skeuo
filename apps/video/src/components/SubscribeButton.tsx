import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/AppStore';

interface SubscribeButtonProps {
  channelId: string;
  small?: boolean;
}

/**
 * Subscribe/unsubscribe. The era required an account for this, so signed-out
 * visitors get an honest sign-in link carrying a return path.
 *
 * This runs against a local profile in Milestone 1; it is not authentication.
 */
export function SubscribeButton({ channelId, small = false }: SubscribeButtonProps) {
  const { profile, isSubscribed, toggleSubscribe, toast, getChannel } = useStore();
  const location = useLocation();
  const channel = getChannel(channelId);
  const subscribed = isSubscribed(channelId);
  const className = `button button--small${subscribed ? '' : ' button--primary'}`;

  if (!profile) {
    return (
      <Link
        className={className}
        to={`/signin?next=${encodeURIComponent(location.pathname + location.search)}`}
      >
        Sign in to subscribe
      </Link>
    );
  }

  const handleClick = () => {
    toggleSubscribe(channelId);
    toast(
      subscribed
        ? `Unsubscribed from ${channel?.name ?? 'channel'}.`
        : `Subscribed to ${channel?.name ?? 'channel'}. New uploads appear in Subscriptions, newest first.`,
      'success',
    );
  };

  return (
    <button
      type="button"
      className={`${className}${small ? ' button--compact' : ''}`}
      aria-pressed={subscribed}
      onClick={handleClick}
    >
      {subscribed ? 'Unsubscribe' : 'Subscribe'}
    </button>
  );
}
