import uuid
import networkx as nx
from datetime import datetime
from agents.base_agent import BaseAgent
from models.database import get_connection


class KnowledgeGraphAgent(BaseAgent):
    name = "KnowledgeGraphAgent"

    def run(self, context: dict) -> dict:
        entities = context.get("entities", [])
        facts = context.get("facts", [])
        conflicts = context.get("conflicts", [])

        self.thinking(f"Building knowledge graph: {len(entities)} entities, {len(facts)} facts...")

        G = nx.Graph()

        # Add entity nodes
        for entity in entities:
            G.add_node(
                entity["canonical_name"],
                type=entity["entity_type"],
                sources=entity.get("source_docs", []),
                aliases=entity.get("aliases", [])
            )

        # Add fact-derived edges between known entities
        entity_lookup = {e["canonical_name"].lower(): e["canonical_name"] for e in entities}

        for fact in facts:
            subject_node = entity_lookup.get(fact["subject"].lower(), fact["subject"])
            obj_node = entity_lookup.get(fact["value"].lower())

            if obj_node and subject_node != obj_node:
                if not G.has_node(subject_node):
                    G.add_node(subject_node, type="UNKNOWN", sources=[], aliases=[])
                G.add_edge(
                    subject_node, obj_node,
                    relationship=fact.get("attribute", "related_to"),
                    source=fact.get("source_doc", ""),
                    weight=float(fact.get("confidence", 0.8))
                )

        self.action(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

        # Serialize for frontend
        graph_data = {
            "nodes": [
                {
                    "id": node,
                    "label": node[:30],
                    "type": data.get("type", "UNKNOWN"),
                    "sources": data.get("sources", []),
                    "size": max(10, len(data.get("sources", [])) * 5)
                }
                for node, data in G.nodes(data=True)
            ],
            "edges": [
                {
                    "source": u,
                    "target": v,
                    "relationship": data.get("relationship", "related_to"),
                    "weight": data.get("weight", 1.0)
                }
                for u, v, data in G.edges(data=True)
            ]
        }

        # Persist edges
        conn = get_connection()
        for u, v, data in G.edges(data=True):
            conn.execute(
                """INSERT OR IGNORE INTO graph_edges
                   (id, job_id, source_entity, target_entity, relationship, weight, source_doc, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (str(uuid.uuid4()), self.job_id, u, v,
                 data.get("relationship", "related_to"),
                 data.get("weight", 1.0),
                 data.get("source", ""),
                 datetime.utcnow().isoformat())
            )
        conn.commit()
        conn.close()

        self.complete(
            f"Knowledge graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges",
            {"node_count": G.number_of_nodes(), "edge_count": G.number_of_edges(), "graph": graph_data}
        )
        return {**context, "knowledge_graph": graph_data}
