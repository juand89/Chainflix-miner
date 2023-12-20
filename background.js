let isPlaying = null;
const miner = async (isPlaying) => {
    return new Promise((resolve) => {

        const isElementInViewport = (element) => {
            const elementRect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;

            // Check if the element is fully visible
            const isFullyVisible = (elementRect.top >= 0 && elementRect.bottom <= windowHeight);

            // Check if the element is partially visible
            const isPartiallyVisible = (elementRect.top < windowHeight && elementRect.bottom > 0);

            return isFullyVisible || isPartiallyVisible;
        }

        const scrollToElement = (element) => {
            if (element) {
                const elementRect = element.getBoundingClientRect();
                const currentScrollPosition = window.scrollY;
                const scrollDistance = elementRect.top + currentScrollPosition;

                window.scrollTo({
                    top: scrollDistance,
                    behavior: 'smooth' // Use 'auto' for instant scroll, 'smooth' for smooth scrolling
                });
            }
        }

        const waitForAnyElement = (selectors, word) => {
            return new Promise((resolve) => {
                const observer = new MutationObserver((mutationsList) => {
                    mutationsList.forEach((mutation) => {
                        for (const selector of selectors) {
                            const elements = mutation.target.querySelectorAll(selector);
                            if (elements.length > 0) {
                                observer.disconnect();
                                resolve(elements[0]);
                            }
                        }
                    });
                });
                observer.observe(document.body, { childList: true, subtree: true });
            });
        };

        const goToNextVideo = () => {
            const nextVideo = document.querySelector("a[href^='/video']");
            window.location.href = nextVideo.href;
        };

        if (!isPlaying) {
            // console.log("document.querySelector", document.querySelector(".videoPlay"));
            // Callback function to be called when a mutation is detected
            waitForAnyElement(['a[href^="/video"]']).then((element) => {
                setTimeout(() => {
                    element.click();
                    resolve({ isPlaying: true });
                }, 500)
            })
        }
        else if (isPlaying) {
            waitForAnyElement(["video"]).then((element) => {
                const video = document.querySelector("video");
                console.log("video", video)
                video.addEventListener('loadeddata', () => {
                    video.muted = true;
                    video.play();
                    video.addEventListener('ended', () => {
                        resolve({ isPlaying: true });
                        goToNextVideo()
                    })
                })
                video.addEventListener("pause", (e) => {
                    setTimeout(() => {
                        if (Array.from(document.querySelectorAll("span"))
                            .find(el => el.textContent.includes("Error"))) {
                            resolve({ isPlaying: true });
                            goToNextVideo();
                        }
                    }, 2000)
                })
                setTimeout(() => {
                    if (video.readyState <= 2) {
                        resolve({ isPlaying: true });
                        goToNextVideo()
                    }
                }, 60000)
            })

        }

    })

}
let scriptExecuted = false;
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && String(tab.url).includes('chainflix.net') && !scriptExecuted) {
        scriptExecuted = true;
        chrome.tabs.query({}, async (tabs) => {
            if (tabs.some(tab => tab.id === tabId)) {
                const muted = !tab.mutedInfo.muted;
                if (muted) await chrome.tabs.update(tabId, { muted })
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: miner,
                    args: [isPlaying]
                }, (result) => {
                    if (result && result.length > 0) {
                        isPlaying = result[0].result.isPlaying
                        console.log({ isPlaying })
                        scriptExecuted = false;
                    }
                })
            }
        })
    }
})