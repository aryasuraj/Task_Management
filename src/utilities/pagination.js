module.exports = {
    buildPipeline: (page, limit) => {
        return {
            $facet: {
                metadata: [{ $count: "total" }, { $addFields: { page: parseInt(page) } },
                {
                    $addFields: {
                        isNext: {
                            $cond: [
                                { $gt: ["$total", (page * limit)] },
                                true,
                                false
                            ]
                        }
                    }
                }, {
                    $addFields: {
                        isPrev: {
                            $cond: [
                                { $lt: ["$total", (page * limit)] },
                                true,
                                false
                            ]
                        }
                    }
                }
                ],
                data: [{ $skip: (page * limit) - limit }, { $limit: limit }]
            }
        }
    }
};
