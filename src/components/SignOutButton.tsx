import { signOut } from '@/auth';

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        'use server';
        await signOut();
      }}
    >
      <button
        type="submit"
        className="btn btn-ghost"
        style={{ padding: '4px 12px', fontSize: '0.8rem', minHeight: 'auto' }}
      >
        Sign out
      </button>
    </form>
  );
}
