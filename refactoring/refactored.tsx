import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type UserProfileProps = {
  userId: number;
  onUserFetched?: (user: User) => void;
};

/**
 * Exclusive states so "loading + error" or "previous user + new error"
 * cannot be represented.
 */
type UserState =
  | { status: 'loading' }
  | { status: 'success'; user: User }
  | { status: 'error'; message: string };

type UseUserResult = {
  state: UserState;
  refresh: () => void;
};

async function fetchUser(userId: number, signal: AbortSignal): Promise<User> {
  let response: Response;

  try {
    response = await fetch(`https://dummyjson.com/users/${userId}`, { signal });
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new Error('Failed to load user: please check your internet connection.');
  }

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? `User ${userId} could not be found.`
        : `Failed to fetch user (${response.status})`,
    );
  }

  const payload: unknown = await response.json();

  if (!isUser(payload)) {
    throw new Error('Failed to load user: unexpected response format.');
  }

  // Copy only the fields we model. DummyJSON also returns `password` and bank data.
  return {
    id: payload.id,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
  };
}

function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.firstName === 'string' &&
    typeof value.lastName === 'string' &&
    typeof value.email === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to load user.';
}

function useUser(userId: number, onUserFetched?: (user: User) => void): UseUserResult {
  const [state, setState] = useState<UserState>({ status: 'loading' });
  const [refreshKey, setRefreshKey] = useState(0);

  const onUserFetchedRef = useRef(onUserFetched);
  onUserFetchedRef.current = onUserFetched;

  /**
   * Effects run after paint. Resetting here prevents one frame of the previous
   * user being shown under the new `userId`.
   */
  const [seenUserId, setSeenUserId] = useState(userId);
  if (seenUserId !== userId) {
    setSeenUserId(userId);
    setState({ status: 'loading' });
  }

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    fetchUser(userId, controller.signal)
      .then((user) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({ status: 'success', user });
        onUserFetchedRef.current?.(user);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }
        setState({ status: 'error', message: toErrorMessage(error) });
      });

    return () => controller.abort();
  }, [userId, refreshKey]);

  const refresh = useCallback(() => {
    setState({ status: 'loading' });
    setRefreshKey((current) => current + 1);
  }, []);

  return { state, refresh };
}

export default function UserProfile({ userId, onUserFetched }: UserProfileProps) {
  const { state, refresh } = useUser(userId, onUserFetched);

  return (
    <View style={styles.container}>
      <UserDetails state={state} />
      <TouchableOpacity onPress={refresh} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>Refresh User</Text>
      </TouchableOpacity>
    </View>
  );
}

function UserDetails({ state }: { state: UserState }) {
  switch (state.status) {
    case 'loading':
      return <Text>Loading user...</Text>;
    case 'error':
      return <Text style={styles.error}>{state.message}</Text>;
    case 'success':
      return (
        <View>
          <Text style={styles.heading}>User Details:</Text>
          <Text>{`Name: ${state.user.firstName} ${state.user.lastName}`}</Text>
          <Text>{`Email: ${state.user.email}`}</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  heading: {
    fontWeight: 'bold',
  },
  error: {
    marginBottom: 8,
    color: '#b00020',
  },
  button: {
    marginTop: 10,
    backgroundColor: 'blue',
    padding: 10,
  },
  buttonText: {
    color: 'white',
  },
});
