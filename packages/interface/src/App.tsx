import {
	Dedupe as DedupeIntegration,
	HttpContext as HttpContextIntegration,
	init
} from '@sentry/browser';
import '@fontsource/inter/variable.css';
import { LibraryContextProvider, queryClient, useDebugState } from '@polyui/client';
import { QueryClientProvider, defaultContext } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ErrorBoundary } from 'react-error-boundary';
import { MemoryRouter, useNavigate } from 'react-router';
// import 'style.scss';
import { AppRouter } from './AppRouter';
import { ErrorFallback } from './ErrorFallback';

dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);
dayjs.extend(duration);

init({
	dsn: 'https://10a3aa54c3174fb18eedc0510ee0f3d0@o4504380429172736.ingest.sentry.io/4504380438347776',
	environment: import.meta.env.MODE,
	defaultIntegrations: false,
	integrations: [new HttpContextIntegration(), new DedupeIntegration()]
});

export default function PolyInterface() {
	return (
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<QueryClientProvider client={queryClient} contextSharing={true}>
				<Devtools />
				<MemoryRouter>
					<AppRouterWrapper />
				</MemoryRouter>
			</QueryClientProvider>
		</ErrorBoundary>
	);
}

function Devtools() {
	const debugState = useDebugState();

	return debugState.reactQueryDevtools !== 'disabled' ? (
		<ReactQueryDevtools
			position="bottom-right"
			context={defaultContext}
			toggleButtonProps={{
				className: debugState.reactQueryDevtools === 'invisible' ? 'opacity-0' : ''
			}}
		/>
	) : null;
}

function AppRouterWrapper() {
	const navigate = useNavigate();

	return (
		<LibraryContextProvider onNoLibrary={() => navigate('/onboarding')}>
			<AppRouter />
		</LibraryContextProvider>
	);
}
