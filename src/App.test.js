import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the sidebar navigation', () => {
  render(<App />);
  expect(screen.getByText('Articles')).toBeInTheDocument();
  expect(screen.getByText('Gallery')).toBeInTheDocument();
});
