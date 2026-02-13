export default function useIndexReembolsos({ refunds, pagination, loading }) {
    const refundsArray = Array.isArray(refunds)
        ? refunds
        : Array.isArray(refunds?.data)
        ? refunds.data
        : [];

    const paginationObj = pagination || (refunds && refunds.meta ? refunds.meta : null);

    return {
        refunds: refundsArray,
        pagination: paginationObj,
        loading: !!loading,
    };
}
