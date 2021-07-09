import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import App from '../App';


describe('app test', () => {
	const { container } = render(<App />);
	it('textarea가 존재하는가?', () => {
		let tgt = container.querySelector('textarea');
		expect(tgt).toBeInTheDocument();
	});

});
