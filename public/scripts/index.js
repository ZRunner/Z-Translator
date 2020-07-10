function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function test(entries) {
    for (var i = 0; i < entries.length; i++) {
        elem = entries[i];
        if (elem.isIntersecting === true) {
            // console.log('Element has just become visible in screen', elem.target.href);
            elem.target.classList.remove('unloaded');
            observer.unobserve(elem.target);
            break;
        }
    }
    if (entries[i+1] && entries[i+1].isIntersecting) {
        sleep(500).then(() => {test(entries.slice(i+1))})
    }
}

var observer = new IntersectionObserver(function (entries) {
    test(entries);
}, { threshold: [0] });


function main() {
    document.querySelectorAll('.jumbotron').forEach(e => {
        e.classList.add('unloaded');
        observer.observe(e);
    })
}