export async function fetchAllRows(queryBuilder: any, limit = 1000) {
  let allData: any[] = [];
  let from = 0;
  let to = limit - 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await queryBuilder.range(from, to);
    if (error) throw error;
    
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      if (data.length < limit) {
        hasMore = false; // Less than limit means it's the last page
      } else {
        from += limit;
        to += limit;
      }
    } else {
      hasMore = false; // No more data
    }
  }

  return allData;
}
