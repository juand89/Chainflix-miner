let currentTimer = null;
let isPlaying = null;
const miner = async (currentTimer, isPlaying) => {
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
        const waitForAnyElement = (selectors) => {
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

        if (!isPlaying) {
            // console.log("document.querySelector", document.querySelector(".videoPlay"));
            // Callback function to be called when a mutation is detected
            waitForAnyElement(['a[href^="/video"]']).then((element) => {
                setTimeout(() => {
                    const timeString = element.querySelector("span").innerText;
                    console.log(timeString, "timestring")
                    var endMillis = 0;
                    if (timeString) {
                        // const [startTime, endTime] = timeString.split(' / ');
                        const [endMinutes, endSeconds] = timeString.split(':').map(Number);
                        endMillis = (endMinutes * 60 + endSeconds) * 1000;
                        console.log(`End time in milliseconds: ${endMillis} end minutes ${timeString} end seconds ${endSeconds}`);
                    }
                    element.click();
                    resolve({ isPlaying: true, currentTimer: endMillis });
                }, 500)
            })
        }
        else if (isPlaying) {
            waitForAnyElement(["video"]).then((element) => {
                const video = document.querySelector("video");
                video.addEventListener('loadeddata', () => {
                    video.muted = true;
                    video.play();
                    const endMillis = parseInt(video.duration) * 1000;
                    document.addEventListener('visibilitychange', () => {
                        if (document.visibilityState === 'hidden') {
                            console.log("visiblity change", document.visibilityState)
                            video.play();
                        }
                    })
                    console.log(endMillis, "endMillis")
                    setTimeout(() => {
                        const nextVideo = document.querySelector("a[href^='/video']");
                        const shouldScroll = !isElementInViewport(nextVideo);
                        if (shouldScroll) {
                            scrollToElement(nextVideo);
                        }
                        setTimeout(() => {
                            nextVideo.click();
                            resolve({ isPlaying: true, currentTimer: endMillis });
                        }, 500)
                    }, endMillis)
                }
                )
            })

        }

    })
    // setTimeout(() => {
    //     const timeString = document.querySelector("#contentPlayer > div.player-ternal > div:nth-child(3) > div > div.col.pt-2.px-4 > div > div:nth-child(4) > p > span").innerHTML

    //     // Split the time string into start and end times
    //     const [startTime, endTime] = timeString.split(' / ');
    //     const [endMinutes, endSeconds] = endTime.split(':').map(Number);
    //     const endMillis = (endMinutes * 60 + endSeconds) * 1000;

    //     console.log(`End time in milliseconds: ${endMillis} end minutes ${timeString} end seconds ${endSeconds}`);
    //     if (document.querySelector('.videoPlay')) document.querySelector('.videoPlay').click();
    //     setTimeout(() => {
    //         window.scroll({
    //             top: 500,
    //             behavior: "smooth",
    //         });
    //         document.querySelector('a[href^="/video"]').click();
    //         setTimeout(() => {
    //             window.location.reload()
    //         }, 2500)
    //     }, endMillis)
    // }, 3000)

}
let scriptExecuted = false;
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && String(tab.url).includes('chainflix.net') && !scriptExecuted) {
        scriptExecuted = true;
        console.log("tabId", tabId, tab)
        chrome.tabs.query({}, async (tabs) => {
            if (tabs.some(tab => tab.id === tabId)) {
                const muted = !tab.mutedInfo.muted;
                if (muted) await chrome.tabs.update(tabId, { muted })
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: miner,
                    args: [currentTimer, isPlaying]
                }, (result) => {
                    if (result && result.length > 0) {
                        currentTimer = result[0].result.currentTimer;
                        isPlaying = result[0].result.isPlaying
                        console.log({ isPlaying, currentTimer })
                        scriptExecuted = false;
                    }
                })
            }
        })
    }
})