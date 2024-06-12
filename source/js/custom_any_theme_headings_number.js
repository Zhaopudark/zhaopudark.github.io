!(function() {
    document.addEventListener('DOMContentLoaded', () => {
        // Store the current number for each heading level
        let headingCounters = [0, 0, 0, 0, 0, 0]; // Assuming <h1> to <h6>

        // Select all headings
        const headings = document.querySelectorAll('h2, h3, h4, h5, h6'); // skip h1
        let current_heading_level = 0;
        // Iterate over each heading
        headings.forEach(heading => {
            let level = parseInt(heading.tagName.replace('H', ''), 10);
            if (level > current_heading_level){
                headingCounters[level-1] += 1;
            }else if(level == current_heading_level){
                headingCounters[level-1] += 1;
            }else{
                headingCounters[level-1] = 1;
                for (let i = level + 1; i < headingCounters.length; i++) {
                    headingCounters[i] = 0;
                }  
            }
            current_heading_level = level;
            let numberingString = headingCounters.slice(1,level).join('.'); // slice(2-1,level-1+1)
            if (level <= 2){
                numberingString = `${numberingString}.`;
            }
            // Prepend the numbering string to the heading text
            heading.textContent = `${numberingString} ${heading.textContent}`;
        });
    });
})();