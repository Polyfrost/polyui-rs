import { useState } from 'react';
import globe from '../assets/lang.svg';
import logo from '../assets/polylogo.svg';

const languages = [
	{ name: 'English', percentage: '100%', selected: true },
	{ name: 'Español', percentage: '70%', selected: false },
	{ name: 'Français', percentage: '40%', selected: false },
	{ name: '中文', percentage: '20%', selected: false }
];

export default function LanguageSelect() {
	const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

	const handleLanguageClick = (language: (typeof languages)[0]) => {
		setSelectedLanguage(language);
	};

	return (
		<div className="flex h-screen w-screen">
			{/* Left Side */}
			<div className="flex h-full w-1/2 flex-col items-center justify-center bg-gray-900">
				<img src={globe} alt="globe" className="mb-8 h-48 w-48" />
				<img src={logo} alt="logo" className="ml-6 h-14 w-32" />
			</div>

			{/* Right Side */}
			<div className="flex h-full w-1/2 flex-col items-center justify-center bg-gray-700">
				<div className="mb-4 text-4xl font-semibold text-white">OneLauncher</div>
				<div className="mb-8 text-xl font-medium text-white">
					Let’s get you all set-up with the most advanced launcher
				</div>

				{/* Language List */}
				{languages.map((language) => (
					<button
						key={language.name}
						className={`mb-2 flex h-12 w-72 items-center justify-between rounded-lg px-4 ${
							selectedLanguage.name === language.name ? 'bg-blue-500' : 'bg-gray-800'
						}`}
						onClick={() => handleLanguageClick(language)}
					>
						<div className="font-medium text-white">{language.name}</div>
						<div className="text-sm text-gray-300">{language.percentage}</div>
					</button>
				))}

				{/* Buttons */}
				<div className="mt-12 flex justify-end">
					<button className="mr-4 h-10 w-40 rounded-lg bg-gray-800 text-white">Cancel</button>
					<button className="h-10 w-44 rounded-lg bg-blue-500 text-white">Next</button>
				</div>
			</div>
		</div>
	);
}
