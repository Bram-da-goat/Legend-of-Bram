// One browser tab owns the save. Other tabs cannot silently overwrite progress.
function showProblem(title, message) {
  const panel = document.querySelector("#bootError");
  panel.hidden = false;
  document.querySelector("#bootTitle").textContent = title;
  document.querySelector("#bootMessage").textContent = message;
}
window.addEventListener("error", (event) => {
  if (event.error)
    showProblem(
      "The adventure paused",
      "An unexpected error occurred. Reload to return to your last autosave. Your save has not been deleted.",
    );
});
document.querySelector("#reloadGame").onclick = () => location.reload();
window.addEventListener("pageshow", (event) => {
  if (event.persisted) location.reload();
});
async function launch() {
  try {
    await import("./game.js");
  } catch (error) {
    console.error(error);
    showProblem(
      "Unable to start the game",
      "Reload the page. If this continues, check that hardware acceleration and WebGL are enabled in your browser.",
    );
  }
}
if (navigator.locks) {
  navigator.locks
    .request(
      "legend-of-bram-save-writer",
      { ifAvailable: true },
      async (lock) => {
        if (!lock) {
          showProblem(
            "Your journey is open in another tab",
            "Keep playing there, or close the other game tab and reload this one. This protects your autosave.",
          );
          return;
        }
        const closed = new Promise((resolve) =>
          window.addEventListener("pagehide", resolve, { once: true }),
        );
        await launch();
        await closed;
      },
    )
    .catch((error) => {
      console.error(error);
      showProblem(
        "Unable to protect your save",
        "Please reload this tab before continuing.",
      );
    });
} else launch();
