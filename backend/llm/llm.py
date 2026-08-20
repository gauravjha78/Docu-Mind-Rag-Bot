import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
# Prompting for AI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()
# LLM integration

api_key=os.getenv("OPENROUTER_API_KEY")
model=os.getenv("OPENROUTER_MODEL")

def openai(question:str, context:str):

    llm=ChatOpenAI(
    api_key=api_key,
    model=model,
    base_url="https://openrouter.ai/api/v1"
)
    
    # message=input("Enter your dought")

    prompt=ChatPromptTemplate.from_messages(
        [
            ("system",
            """
            You are a helpful assistant answering questions based only on the provided context.
            If the answer isn't in the context, say you don't know — don't make things up.

            Format your answers in clean Markdown:
            - Use **bold** for key terms, names, or labels (e.g. definitions, sources).
            - Use numbered or bulleted lists when presenting multiple points, definitions, or steps.
            - Keep paragraphs short (2-3 sentences max).
            - Do not use headings (#, ##) — this is a chat bubble, not a document.
            - Do not wrap the entire answer in a code block.
            - Keep answer short like summary
            """),
            ("human","Context:\n{context}\n\nQuestion: {question}")
        ]
    )
    result=prompt.format_messages(context=context,question=question) # here topic is just variable because we need to pass two argument's
    response=llm.invoke(result)
    return response.content




    