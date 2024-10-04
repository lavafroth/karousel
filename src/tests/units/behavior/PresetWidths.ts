tests.register("PresetWidths", 1, () => {
    const minWidth = 50;
    const maxWidth = 800;
    const spacing = 10;

    const testCases = [
        { str: "100%, 50%", result: [800, 395] },
        { str: "105%, 50%", result: [800, 395] },
        { str: "100px,50 px", result: [100, 50] },
        { str: "900px,25 px", result: [800, 50] },
        { str: " 100px, 25 % , 0.1 ", result: [192, 100, 71] },
        { str: "100px, 25%, 0.1, 100px", result: [192, 100, 71] },
        { str: "100px, -25 % , 0.1 ", error: true },
        { str: "100px, 25 % , -0.1 ", error: true },
        { str: "100px, 25 % , 0.1p", error: true },
        { str: "100px, % , 0.1 ", error: true },
        { str: "100px,  , 0.1 ", error: true },
        { str: "100px, 0, 0.1 ", error: true },
        { str: "100px,, 0.1 ", error: true },
        { str: "100px, 25 % , ", error: true },
        { str: "asdf", error: true },
        { str: "", error: true },
        { str: " ", error: true },
    ];

    for (const testCase of testCases) {
        try {
            const presetWidths = new PresetWidths(testCase.str, spacing);
            Assert.truth(!testCase.error);

            const result = presetWidths.get(minWidth, maxWidth);
            Assert.equalArrays(result, testCase.result!);
        } catch (error) {
            Assert.truth(testCase.error === true);
        }
    }
});
