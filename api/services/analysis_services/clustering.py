from api.legacy.analysis.clustering import cluster_levels
from api.models.analysis_models import ClusteringReq


def execute_clustering(req: ClusteringReq):
    """
    Service for AHCA(Agglomerative Heirarchical Clustering).
    """

    res = cluster_levels(levels=req.levels)

    if res is None:
        raise ValueError("Need at least 2 levels")
    
    return res