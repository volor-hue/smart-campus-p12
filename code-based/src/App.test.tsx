// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

afterEach(cleanup);

function fillAndCheck(opts: {
  start?: string;
  duration?: string;
  blocked?: boolean;
  now?: string;
}) {
  render(<App />);
  if (opts.now !== undefined) {
    fireEvent.change(screen.getByLabelText('Reference current time'), { target: { value: opts.now } });
  }
  if (opts.blocked) {
    fireEvent.click(screen.getByRole('checkbox', { name: 'Room blocked' }));
  }
  if (opts.start !== undefined) {
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: opts.start } });
  }
  if (opts.duration !== undefined) {
    fireEvent.change(screen.getByLabelText('Duration (minutes)'), { target: { value: opts.duration } });
  }
  fireEvent.click(screen.getByRole('button', { name: /check availability/i }));
}

const badge = () => screen.getByTestId('status-badge');

describe('P12 code-based UI against the shared contract', () => {
  it('T1: 11:30 for 60 minutes is Available', () => {
    fillAndCheck({ start: '11:30', duration: '60' });
    expect(within(badge()).getByText('Available')).toBeTruthy();
    expect(screen.getByTestId('reason-code').textContent).toMatch(/available/);
    expect(screen.getByTestId('message').textContent).toBe(
      'Room 101 is available from 11:30 to 12:30 (60 min).'
    );
  });

  it('T2: 10:30 for 60 minutes is Unavailable (overlap)', () => {
    fillAndCheck({ start: '10:30', duration: '60' });
    expect(within(badge()).getByText('Unavailable')).toBeTruthy();
    expect(screen.getByTestId('reason-code').textContent).toMatch(/overlap/);
  });

  it('T3: blocked room is Unavailable', () => {
    fillAndCheck({ start: '11:30', duration: '60', blocked: true });
    expect(within(badge()).getByText('Unavailable')).toBeTruthy();
    expect(screen.getByTestId('reason-code').textContent).toMatch(/blocked/);
  });

  it('T4: duration 0 is a Validation Error', () => {
    fillAndCheck({ start: '11:30', duration: '0' });
    expect(within(badge()).getByText('Validation Error')).toBeTruthy();
    expect(screen.getByTestId('reason-code').textContent).toMatch(/invalid_duration/);
  });

  it('T5: duration 121 is a Validation Error', () => {
    fillAndCheck({ start: '11:30', duration: '121' });
    expect(within(badge()).getByText('Validation Error')).toBeTruthy();
    expect(screen.getByTestId('reason-code').textContent).toMatch(/duration_too_long/);
  });

  it('T6: start 08:30 with now 09:00 is a Validation Error', () => {
    fillAndCheck({ start: '08:30', duration: '60', now: '09:00' });
    expect(within(badge()).getByText('Validation Error')).toBeTruthy();
    expect(screen.getByTestId('reason-code').textContent).toMatch(/past_start/);
  });

  it('T7: adjacent 11:00 for 60 minutes is Available', () => {
    fillAndCheck({ start: '11:00', duration: '60' });
    expect(within(badge()).getByText('Available')).toBeTruthy();
    expect(screen.getByTestId('message').textContent).toBe(
      'Room 101 is available from 11:00 to 12:00 (60 min).'
    );
  });

  it('empty start time is rejected with understandable feedback', () => {
    fillAndCheck({ start: '', duration: '60' });
    expect(within(badge()).getByText('Validation Error')).toBeTruthy();
    expect(screen.getByTestId('message').textContent).toMatch(/Start time/);
  });

  it('changing an input clears the previous decision', () => {
    fillAndCheck({ start: '11:30', duration: '60' });
    expect(screen.getByTestId('status-badge')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Duration (minutes)'), { target: { value: '45' } });
    expect(screen.queryByTestId('status-badge')).toBeNull();
  });
});
