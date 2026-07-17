def normalized_dtw_distance(left: list[float], right: list[float]) -> float:
    if not left or not right:
        return 1.0
    rows, cols = len(left), len(right)
    dp = [[float("inf")] * (cols + 1) for _ in range(rows + 1)]
    dp[0][0] = 0.0
    for i in range(1, rows + 1):
        for j in range(1, cols + 1):
            cost = abs(left[i - 1] - right[j - 1])
            dp[i][j] = cost + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[rows][cols] / max(rows, cols)
