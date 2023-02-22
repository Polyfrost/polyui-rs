import { useState } from 'react';
import lang from '../assets/lang.svg';
import polylogo from '../assets/polylogo.svg';

const languages: Array<{ name: string; localization: string }> = [
	{ name: 'English', localization: '100%' },
	{ name: 'Francais', localization: '80%' },
	{ name: 'Espanol', localization: '50%' },
	{ name: 'Polski', localization: '20%' }
];

export default function LanguageSelect() {
	const [selectedLanguage, setSelectedLanguage] = useState(0);

	return (
		<div className="flex h-screen bg-gray-800">
			{/* Left Half */}
			<div className="flex-1 overflow-hidden rounded-l-2xl bg-gray-800">
				{/* Logo */}
				<div className="absolute top-0 left-0 pt-10 pl-10">
					<img src={polylogo} alt="Logo" />
				</div>

				{/* Globe Icon */}
				<div className="flex items-center justify-center pt-32">
					<img src={lang} alt="Globe" />
				</div>
			</div>

			{/* Right Half */}
			<div className="flex flex-1 flex-col items-center justify-center px-16">
				{/* OneLauncher Title */}
				<h1 className="mb-4 text-3xl font-semibold text-white">OneLauncher</h1>

				{/* Description */}
				<p className="mb-8 text-center text-gray-400">
					Let’s get you all set-up with the most advanced launcher
				</p>

				{/* Language Selection */}
				<div className="mb-8 flex flex-col items-start">
					<h2 className="mb-2 text-lg font-medium text-white">Choose your preferred language</h2>
					<div className="flex flex-col items-start gap-2">
						{languages.map((language, index) => (
							<button
								key={index}
								className={`bg-${
									selectedLanguage === index ? 'blue' : 'gray'
								}-700 text-md w-96 rounded-lg py-2 px-4 font-medium text-white`}
								style={{ borderRadius: '12px' }}
								onClick={() => setSelectedLanguage(index)}
							>
								<div className="flex items-center justify-between">
									<span>{language.name}</span>
									<span>{language.localization}</span>
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Action Buttons */}
				<div className="absolute bottom-0 right-0 mb-8 mr-8 flex items-center justify-end">
					<button
						className="text-md mr-4 w-40 rounded-lg bg-gray-700 py-2 px-4 font-medium text-white"
						style={{ borderRadius: '10px' }}
					>
						Cancel
					</button>
					<button
						className="text-md flex w-40 items-center justify-center rounded-lg bg-blue-700 py-2 px-4 font-medium text-white"
						style={{ borderRadius: '10px' }}
					>
						Next
						<div className="ml-2">
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M3.33337 7.99992H12.6667M12.6667 7.99992L8.00004 3.33325M12.6667 7.99992L8.00004 12.6666"
									stroke="white"
									stroke-opacity="0.9"
									stroke-width="1.6"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
					</button>
				</div>
			</div>
		</div>
	);
}
