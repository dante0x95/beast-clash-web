import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReplayControls } from "./ReplayControls";

import type { ComponentProps } from "react";

type Props = ComponentProps<typeof ReplayControls>;

function renderControls(overrides: Partial<Props> = {}) {
  const props: Props = {
    canRestart: false,
    isAnimating: false,
    isReady: true,
    onPause: vi.fn<Props["onPause"]>(),
    onPlay: vi.fn<Props["onPlay"]>(),
    onRestart: vi.fn<Props["onRestart"]>(),
    onSkip: vi.fn<Props["onSkip"]>(),
    onSpeedChange: vi.fn<Props["onSpeedChange"]>(),
    onStep: vi.fn<Props["onStep"]>(),
    speed: 1,
    status: "idle",
    ...overrides,
  };

  render(<ReplayControls {...props} />);

  return props;
}

const button = (name: string) => screen.getByRole("button", { name });

describe("ReplayControls", () => {
  it("disables every control until the scene is ready", () => {
    renderControls({ canRestart: true, isReady: false });

    for (const name of ["Play", "Next turn", "Skip", "Restart", "1x", "2x", "4x"])
      expect(button(name)).toBeDisabled();
  });

  it("plays from idle and steps manually", async () => {
    const user = userEvent.setup();
    const onPlay = vi.fn<Props["onPlay"]>();
    const onStep = vi.fn<Props["onStep"]>();
    renderControls({ onPlay, onStep });

    await user.click(button("Play"));
    await user.click(button("Next turn"));

    expect(onPlay).toHaveBeenCalledOnce();
    expect(onStep).toHaveBeenCalledOnce();
    expect(button("Restart")).toBeDisabled();
  });

  it("shows Pause while playing and blocks manual steps", async () => {
    const user = userEvent.setup();
    const onPause = vi.fn<Props["onPause"]>();
    renderControls({ canRestart: true, isAnimating: true, onPause, status: "playing" });

    await user.click(button("Pause"));

    expect(onPause).toHaveBeenCalledOnce();
    expect(button("Next turn")).toBeDisabled();
    // skip and restart stay available: they are queued until the turn ends
    expect(button("Skip")).toBeEnabled();
    expect(button("Restart")).toBeEnabled();
  });

  it("blocks manual steps while a turn is animating", () => {
    renderControls({ isAnimating: true, status: "paused" });

    expect(button("Next turn")).toBeDisabled();
    expect(button("Play")).toBeEnabled();
  });

  it("only allows restarting once the battle is finished", async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn<Props["onRestart"]>();
    renderControls({ canRestart: true, onRestart, status: "finished" });

    expect(button("Play")).toBeDisabled();
    expect(button("Next turn")).toBeDisabled();
    expect(button("Skip")).toBeDisabled();

    await user.click(button("Restart"));

    expect(onRestart).toHaveBeenCalledOnce();
  });

  it("skips to the result", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn<Props["onSkip"]>();
    renderControls({ onSkip, status: "paused" });

    await user.click(button("Skip"));

    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("marks the current speed and changes it", async () => {
    const user = userEvent.setup();
    const onSpeedChange = vi.fn<Props["onSpeedChange"]>();
    renderControls({ onSpeedChange, speed: 2 });

    expect(button("1x")).toHaveAttribute("aria-pressed", "false");
    expect(button("2x")).toHaveAttribute("aria-pressed", "true");

    await user.click(button("4x"));

    expect(onSpeedChange).toHaveBeenCalledWith(4);
  });
});
