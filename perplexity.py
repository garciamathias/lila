import logging
import requests
import json
from .config import perplexity_client

def perplexity(input, 
            context=None, 
            instructions=None, 
            model='llama-3.1-sonar-large-128k-online', 
            streaming=False, 
            temperature=0.2,  # Changed default
            max_tokens=None,  # Changed to None as it's optional
            top_p=0.9,       # Changed default
            frequency_penalty=1,  # Changed default
            presence_penalty=0,
            search_domain_filter=None,  # New parameter
            return_images=False,        # New parameter
            return_related_questions=False,  # New parameter
            search_recency_filter=None):     # New parameter
    
    logging.info(f"=== Nouvelle requête Perplexity - Prompt: {input} ===")
    
    if not isinstance(input, str):
        logging.error("Le prompt doit être une chaîne de caractères.")
        return "Le prompt doit être une chaîne de caractères."
    try:
        # Construire le message system
        system_message = {
            "role": "system", 
            "content": "You are an artificial intelligence assistant and you need to engage in a helpful, detailed, polite conversation with a user."
        }
        if instructions:
            system_message["content"] += f" {instructions}"
        # Préparer les messages avec le contexte
        messages = [system_message]
        
        # Traiter le contexte si présent
        if context:
            for msg in context:
                content = msg['content'][0]['text'] if isinstance(msg['content'], list) else msg['content']
                messages.append({
                    "role": msg['role'],
                    "content": content
                })
        # Ajouter le prompt actuel seulement s'il n'est pas déjà le dernier message
        if not messages[-1]['content'] == input:
            messages.append({
                "role": "user",
                "content": input
            })
        logging.info(f"Messages envoyés: {len(messages)}")
        # Préparer les paramètres de l'API
        api_params = {
            "model": model,
            "messages": messages,
            "stream": streaming,
            "temperature": temperature,
            "top_p": top_p,
            "frequency_penalty": frequency_penalty,
            "presence_penalty": presence_penalty,
        }
        
        # Ajouter les paramètres optionnels seulement s'ils sont spécifiés
        if max_tokens is not None:
            api_params["max_tokens"] = max_tokens
        if search_domain_filter:
            api_params["search_domain_filter"] = search_domain_filter
        if search_recency_filter:
            api_params["search_recency_filter"] = search_recency_filter
        if return_images:
            api_params["return_images"] = return_images
        if return_related_questions:
            api_params["return_related_questions"] = return_related_questions

        # Envoyer la requête au modèle avec tous les paramètres
        response = perplexity_client.chat.completions.create(**api_params)

        # Gérer le streaming
        if streaming:
            return stream_response(response)
        else:
            result = response.choices[0].message.content
            # Ajouter les citations si elles existent
            if hasattr(response, 'citations') and response.citations:
                result += "\n\nCitations:\n" + "\n".join(response.citations)
            return result

    except Exception as e:
        error_msg = f"Erreur Perplexity: {str(e)}"
        logging.exception("Erreur rencontrée lors de l'appel à Perplexity.")
        return error_msg

def stream_response(response):
    """Fonction auxiliaire pour gérer le streaming"""
    full_response = ""
    all_citations = set()  # Utiliser un set pour éviter les doublons
    
    try:
        for chunk in response:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                full_response += content
                print(content, end='', flush=True)
                # Collecter uniquement les nouvelles citations
                if hasattr(chunk, 'citations') and chunk.citations:
                    all_citations.update(chunk.citations)
                yield content
        
        # Après avoir fini le streaming, envoyer les citations uniques si présentes
        if all_citations:
            citations_text = "\n\nCitations:\n" + "\n".join(sorted(all_citations))
            print(citations_text)
            yield citations_text
        print()  # Nouvelle ligne après la fin du streaming
    except Exception as e:
        error_msg = f"Erreur pendant le streaming: {str(e)}"
        logging.exception(error_msg)
        yield error_msg