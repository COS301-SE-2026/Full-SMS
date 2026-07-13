from celery import shared_task
from api.legacy.analysis.clustering import cluster_levels
from api.legacy.models.level import LevelData
from dataclasses import asdict


@shared_task(name="execute_clustering_analysis")
def clustering_job(levels: list[dict]):
    """
    Backgroung job for AHC analysis.
    """
    levels_dict =[]
    for level in levels:
        levels.append(LevelData(**level))

    clustering_response = cluster_levels(levels=levels_dict)

    if clustering_response is None:
        raise ValueError("At least 2 levels are needed to execute clustering")

    result = asdict(clustering_response)
    return result 