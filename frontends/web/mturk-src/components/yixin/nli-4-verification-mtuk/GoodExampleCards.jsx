import React from "react";
import {Button} from "react-bootstrap";


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}


class ExampleGoodCards extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            curExample: null,
            show: false
        }

        this.data = [
            {
                passage: "I found out my cat is pregnant. I had no idea why she was making all these funny noises. She would hide a lot under my bed. A friend told me this behavior was of a pregnant animal. I cannot wait to see the kittens.",
                hypothesis: "The woman is pregnant and has a cat.",
                targetLabel: 1,
                modelPrediction: [0.8643, 0.0032, 0.1325],
                labelExplanation: "First of all, there is no woman in the passage. We cannot assume that the person is a woman. Secondly, the person does have a cat, but it is not known whether the person is pregnant or not. The passage only states that the cat might be pregnant.",
                modelExplanation: "The passage and statement have a lot of word overlap. The AI might not be able to understand which entity is pregnant. This might make the AI believe that the statement is \"definitely correct\".",
            },
            {
                passage: "The 2015 Red Bull Air Race of Fort Worth was the seventh round of the 2015 Red Bull Air Race World Championship season, the tenth season of the Red Bull Air Race World Championship. The event was held at the Texas Motor Speedway in Fort Worth, Texas.",
                hypothesis: "The Red Bull Air Race of Fort Worth was first held in Texas in 2015. The Air Race was never held in Texas prior to that.",
                targetLabel: 1,
                modelPrediction: [0.9979540, 0.001679135, 0.000366835884],
                labelExplanation: "The passage states that the 2015 Red Bull Air Race of Fort Worth was held in Fort Worth, Texas. But it didn’t say whether the race has been held in Fort Worth, Texas previously. It is possible that the 2014 Red Bull Air Race also took place in Fort Worth, Texas. Therefore, we cannot be certain about whether 2015 is the first time.",
                modelExplanation: "I tried to reuse words in the passage so the AI will think the statement paraphrases the passage,  and then should be ‘definitely correct’. I don’t think the AI is able to reason about the time. It doesn’t know that some events like Air Race can be held twice or three times in the same city or state. Or maybe the AI just doesn’t know that cities can host competitions or exhibitions.",
            },
            {
                passage: "The 2015 Red Bull Air Race of Fort Worth was the seventh round of the 2015 Red Bull Air Race World Championship season, the tenth season of the Red Bull Air Race World Championship. The event was held at the Texas Motor Speedway in Fort Worth, Texas.",
                hypothesis: "There is no airport in Fort Worth, Texas.",
                targetLabel: 2,
                modelPrediction: [0.00020863, 0.93687433, 0.062917076],
                labelExplanation: "Since an Air Race happened in Fort Worth, there must be an airport in the city. An Air Race is a race between airplanes and airplanes only race in the air and must land in airports. It is also a fact that Dallas/Fort Worth Airport exists.",
                modelExplanation: "I write the statement by first thinking about what facts are needed for the event described in the passage to happen. A city needs an airport to be able to hold the Red Bull Air Race. Then, I negated that fact to create a statement that is definitely incorrect. The AI might not know what is required for an Air Race to happen. It also might not know what an Air Race is.",
            },
            {
                passage: "The 2015 Red Bull Air Race of Fort Worth was the seventh round of the 2015 Red Bull Air Race World Championship season, the tenth season of the Red Bull Air Race World Championship. The event was held at the Texas Motor Speedway in Fort Worth, Texas.",
                hypothesis: "In 2014, the Blue Air Race happened in Texas. In 2015, the Red Bull Air Race happened in Texas. What a coincidence!",
                targetLabel: 1,
                modelPrediction: [0.9782385826, 0.0136522576212883, 0.008109178394079208],
                labelExplanation: "The passage doesn’t say anything about what happened in 2014 and doesn’t mention any Blue Air Race. It is possible though that there was a Blue Air Race in 2014 and it is also possible it took place in Texas. But since we don’t know for sure, the statement cannot be correct or incorrect.",
                modelExplanation: "I wrote an uncertain sentence first and then wrote a certainly correct sentence afterwards to try to confuse the model. The AI might think that the entire statement is correct simply because the second sentence in the statement is correct. The AI probably won’t know that all the facts in the statement need to be correct based on the passage for the whole statement to be correct.",
            },
            {
                passage: "The 2015 Red Bull Air Race of Fort Worth was the seventh round of the 2015 Red Bull Air Race World Championship season, the tenth season of the Red Bull Air Race World Championship. The event was held at the Texas Motor Speedway in Fort Worth, Texas.",
                hypothesis: "People will look up to the sky during the event.",
                targetLabel: 0,
                modelPrediction: [0.007144447881728411, 0.9927288889884949, 0.00012666970724239945],
                labelExplanation: "When people go to see an Air Race, they plan  to watch airplanes. Since airplanes fly in the sky, people watching them will definitely look up to the sky.",
                modelExplanation: "The AI might not understand what people plan to do when they watch an air race and also might not know what an air race is. The AI might wrongly determine that the passage and the statement are unrelated because there is almost no word overlap between the two.",
            },
            {
                passage: "Kota Ramakrishna Karanth was an Indian lawyer and politician. He was the elder brother of noted Kannada novelist K. Shivarama Karanth.",
                hypothesis: "Kota Ramakrishna Karanth has a brother who was both a novelist and a politician.",
                targetLabel: 2,
                modelPrediction: [0.9947, 0.0004, 0.0049],
                labelExplanation: "Kota Ramakrishna Karanth is a politician and has a brother who was a novelist. But we’re not sure whether the brother is a politician or not. Therefore, the statement is neither correct nor incorrect.",
                modelExplanation: "The passage states that Kota Ramakrishna Karanth is a politician and his brother is a novelist. The AI might not be able to understand the grammar and mistakenly thinks that since the passage contains both \"politician\" and \"novelist\" then the statement is correct.",
            },
            {
                passage: "A couple had been fighting over several things and later their children were found drowned in a river. The husband reported to the police that his children are missing. Police however became suspicious due to \" holes in his story\" and he later changed his story.",
                hypothesis: "The husband put holes in his story on purpose because the police were suspicious of him.",
                targetLabel: 2,
                modelPrediction: [0.00014173502859193832, 0.9996548891067505, 0.00020337234309408814],
                labelExplanation: "The police became suspicious because of the holes in the husband’s story. The husband didn’t put holes because the police were suspicious. The temporal order of things is incorrect. Additionally, common sense suggests that people usually want the police to believe their alibis, so it’s very unlikely that someone would intentionally leave holes in their story.",
                modelExplanation: "I swapped the causal relation between the two facts. The AI might not be able to correctly infer the causal relation between the facts. One fact can cause another thing to happen but not the other way around. I also think the model might have had trouble understanding that “holes in his story” referred to holes in the husband’s story. It might also have been confused by the idiom “holes in a story”.",
            },
            {
                passage: "Millions of people in the world jog for exercise. For the most part, jogging can be a healthy way to stay fit. However, problems can also develop for those who jog in the heat. Excessive sweating can lead to electrolyte loss that could be life-threatening. Early symptoms of electrolyte deficiency can include nausea, fatigue, and dizziness. If not treated, individuals can experience muscle weakness and increased heart rate (which could lead to a heart attack). Many sports drinks can be consumed to restore electrolytes quickly in the body.",
                hypothesis: "Jogging outside is healthy on a hot summer day.",
                targetLabel: 2,
                modelPrediction: [0.019317345693707466, 0.9759466648101807, 0.004736035596579313],
                labelExplanation: "On a hot summer day, the temperature outside is high. Jogging outside would then require jogging in the heat, and that can cause health problems.",
                modelExplanation: "AI might not know that jogging outside in the heat will necessarily take place on a hot summer day.",
            },
            {
                passage: "Millions of people in the world jog for exercise. For the most part, jogging can be a healthy way to stay fit. However, problems can also develop for those who jog in the heat. Excessive sweating can lead to electrolyte loss that could be life-threatening. Early symptoms of electrolyte deficiency can include nausea, fatigue, and dizziness. If not treated, individuals can experience muscle weakness and increased heart rate (which could lead to a heart attack). Many sports drinks can be consumed to restore electrolytes quickly in the body.",
                hypothesis: "Millions of people met problems when jogging.",
                targetLabel: 1,
                modelPrediction: [0.9884483218193054, 0.006276988424360752, 0.005274685565382242],
                labelExplanation: "The passage only states that millions of people jog for exercise and that jogging in heat is likely to cause health problems. It does not mention whether millions of people met problems when jogging. It could be true, but it also could be false if only a few people met problems when jogging.",
                modelExplanation: "The statement has a large word overlap with the passage which makes it believe that the statement is correct. The AI couldn’t understand the fact that just because something can happen does not necessarily mean that it did happen. I also used the somewhat nonstandard phrasing “met problems”, which could’ve fooled the model.",
            },
            {
                passage: "Millions of people in the world jog for exercise. For the most part, jogging can be a healthy way to stay fit. However, problems can also develop for those who jog in the heat. Excessive sweating can lead to electrolyte loss that could be life-threatening. Early symptoms of electrolyte deficiency can include nausea, fatigue, and dizziness. If not treated, individuals can experience muscle weakness and increased heart rate (which could lead to a heart attack). Many sports drinks can be consumed to restore electrolytes quickly in the body.",
                hypothesis: "Jogging in a gym is healthier than jogging outside on a hot summer day.",
                targetLabel: 0,
                modelPrediction: [0.00207421462982893, 0.9978392720222473, 8.654474368086085e-05],
                labelExplanation: "As stated in the passage, jogging in the heat will cause health problems. On a hot summer day, jogging outside would result in jogging in the heat, so it is better to jog inside in a gym where it is cooler. That will let you avoid the health problems caused by overheating.",
                modelExplanation: "AI might be unable to compare jogging in the gym with jogging outside. It may not know that there are alternative places to jog, or it may not know that people generally cool the inside of buildings, like gyms, in the summer.  Thus, the AI might not know that a gym will probably be cooler than outdoors on a hot summer day.",
            },
            {
                passage: "In 2018, Aayush Jain, a graduate student at the University of California, Los Angeles, traveled to Japan to give a talk about a powerful cryptographic tool he and his colleagues were developing. As he detailed the team's approach to indistinguishability obfuscation (iO for short), one audience member raised his hand in bewilderment.",
                hypothesis: "Aayush Jain and his colleagues traveled to Japan to give a talk.",
                targetLabel: 1,
                modelPrediction: [0.9736843109130859, 0.00926456693559885, 0.017051102593541145],
                labelExplanation: "The premise only mentioned that Aayush Jain traveled to Japan, it is unclear whether his colleagues also traveled to Japan.",
                modelExplanation: "The passage mentioned both \"Aayush traveled to Japan\" and \"he and his colleagues\". It might have merely made a surface level decision based on matching up words across the passage and statement.",
            },
            {
                passage: "In an effort to boost Uganda's economy, the government has been investing in the agricultural sector by helping farmers afford the farm inputs they need with vouchers and money subsidies. However, the current system often proves to be obsolete, resulting in farmers losing money or using the money for personal purposes or renouncing altogether to the subsidy when faced with the confusing voucher application process. Evelyn Namara, Founder and CEO of Vouch Digital joins CNBC Africa for more.",
                hypothesis: "Wheat farmers in Uganda's agricultural sector rarely renounce vouchers from the government because they know that any money from the system can only be used for agricultural purposes.",
                targetLabel: 1,
                modelPrediction: [7.34475688659586e-05, 0.0017879507504403591, 0.9981385469436646],
                labelExplanation: "We don’t know anything about wheat farmers in specific. Even when Ugandan farmers in general do something (like use government money for nonauthorized personal spending), it's not clear that the subtype of farmer, here wheat farmers, will do so too. We also don't know how often wheat farmers will renounce vouchers, so we can't be sure they only do it rarely.",
                modelExplanation: "Many words in the passage were repeated, though they were repeated in a different order. The model might also assume that sweeping generalizations are always correct, when this is not true.",
            },
            {
                passage: "Lost Money One day: Greg was driving home from work. He needed to drop by the cleaners to pick up his clothes. As he got out of his car he saw something green on the ground. As he stepped closer he saw that it was money. There were 10,100 dollar bills laying on the ground!",
                hypothesis: "Greg lives his entire life inside his personally owned vehicle. He even washes his laundry in the back seat of his green car.",
                targetLabel: 2,
                modelPrediction: [0.0003242067468818277, 0.9991458654403687, 0.0005298936157487333],
                labelExplanation: "We know Greg goes to work so unless he parks somewhere and works in his car, which would be highly unusual, he can’t be  spending his entire life in his car. Also, we know that he does his laundry at the cleaners, so there's no reason to believe he washes his clothes in the back of his car, if that was even possible (people can't really do laundry in cars).",
                modelExplanation: "Perhaps the model made a mistake because I referred to many preconditions of the sentence. Perhaps the model doesn't know that people can't really spend their entire life in cars. Perhaps it didn't realize that \"his car\" is the same as \"his personally owned vehicle\" or that “laundry” and “clothes” are similar concepts. Perhaps the model was confused by my use of \"green\" which was present in the passage, but wasn't used to describe the color of the car itself. If we had only mentioned that his car was green, then the model would be correct in choosing the neutral label, but with the rest of the example there, it’s impossible that this example is neutral.",
            },
            {
                passage: "Disappointment Anna went to Washington DC to protest the election. She believes neither candidate is a potential president. She also thinks the government is corrupt. She plans to move to England one day soon. She feels she would be happier there.",
                hypothesis: "Anna believes her mood would be better if she lived in England. Protesting presidential elections in America is something she has done before.",
                targetLabel: 0,
                modelPrediction: [0.0004888097755610943, 0.9994150400161743, 9.609226253814995e-05],
                labelExplanation: "I have paraphrased two sentences in the context. Since Anna feels she would be happier in England that means she thinks her mood would be better if she lived there. Also, she protested the election because she believes neither candidate is a potential president. That means the election she protested in Washington DC was a presidential election. Since Washington DC is in America, she has protested a presidential election in America before.",
                modelExplanation: "I think the model might have had trouble realizing that \"she\" refers to Anna, it also might've not realized that if Anna went to Washington DC to protest an election for which she believes neither candidate is a potential president, that means she has protested an American presidential election in the past (i.e., she has done it before).",
            },
            {
                passage: "Akito Marquies Hutcherson A Henry County man faces multiple drug charges, following the execution of a search warrant. According to Capt. Randall McGowan of the Weakley County Sheriff's Department, 33-year-old Akito Marquies Hutcherson of 303 Jenkins Street in Paris is charged with possession of Schedule 2 with intent to resale, possession of schedule 6 with intent to resale and possession of drug paraphernalia. (See complete story in Aug. 16th issue of the Dresden Enterprise.)",
                hypothesis: "A person supposedly planned to trade something he bought to yet another person in exchange for a larger amount of valuable money.",
                targetLabel: 0,
                modelPrediction: [0.0015618825564160943, 0.9983539581298828, 8.416191121796146e-05],
                labelExplanation: "Akito Marquies Hutcherson is a person and he is charged with possessing a drug that he wanted to resell. A drug is a thing. And reselling something means that you purchased it and plan to sell it to someone else for more more than what you bought it for. Otherwise why would you have bought with the intent to resell it? (no one resells things for the same amount they bought it for, because that would be pointless).",
                modelExplanation: "The model might not have known Akito is a person. It also might not have known that \"supposedly\" is valid here, since the man hasn't yet been charged and only faces charges. Finally, it doesn't seem to know what resale means. The model might no know that money is valuable by definition.",
            },
            {
                passage: "Fred buys a car Fred knew he needed a new car. The one he had was starting to fall apart. One day fred's old car blew up with the engine smoking. Fred decided to get a tow truck to a dealership. Fred found the first car he could see and signed the lease.",
                hypothesis: "Fred deliberated long and hard about whether to sign a lease for a new car after his old one had a broken engine.",
                targetLabel: 2,
                modelPrediction: [0.0002105917374137789, 0.9994397759437561, 0.00034951703855767846],
                labelExplanation: "If Fred found the first car he could see and signed the lease, that means he didn't deliberate for very long.",
                modelExplanation: "I think the idiom \"long and hard” might have fooled the model. Perhaps the model didn't understand that finding the first car you can see and signing its lease means Fred made a snap decision. It is also possible that it didn't connect \"old car\" in the context and \"old one\" in the sentence I wrote.",
            },
            {
                passage: "ZURICH/BERLIN, Jan 29 (Reuters) - Here are some of the main factors that may affect Swiss stocks on Tuesday: COMPANY STATEMENTS * Gurit Holding said it will enlarge its group executive committee to eight members, from six at present, effective Feb. 1. * LafargeHolcim said it was exploring options for its business in the Philippines, including a potential sale, as the cement giant seeks to further reduce debt by selling non-core assets. ECONOMY Swiss December trade data due at 0700 GMT.",
                hypothesis: "Zurich and Berlin are two names for the same location.",
                targetLabel: 2,
                modelPrediction: [0.9988705515861511, 0.00013840988685842603, 0.0009910735534504056],
                labelExplanation: "Factually, Zurich and Berlin are different cities. But even if the model didn't know that, it should know that the conventions of formal text do not refer to one object with two names by putting a dash in between those names.",
                modelExplanation: "The model might not have known that Zurich and Berlin are different cities. The model might not have known the required formal writing conventions that allow us humans to conclude that Zurich/Berlin means that Zurich and Berlin are two places and the present news report was published in both. Perhaps it also thinks the number two is highly indicative of an entailment?",
            },
            {
                passage: "In fact, I'm for shrinking the size of government. I want a smaller and smarter government. I have been in charge of this reinventing government streamlining project that's reduced the size of government by more than 300,000 people in the last several years.",
                hypothesis: "I would prefer it if the ruling bodies of the nation in which I live become smaller as time progresses, because I think streamlining will make those bodies less smart.",
                targetLabel: 2,
                modelPrediction: [0.0007441261550411582, 0.7366762161254883, 0.26257967948913574],
                labelExplanation: "The example is contradictory because the speaker/author believes that it is possible to have smaller and smarter government. They would not agree if someone said they want to make the government less smart.",
                modelExplanation: "I used many synonyms of words in the context. I also used some complex syntax, and created a cause and effect relationship that the original context's writer wouldn't agree with.",
            },
            {
                passage: "Codi Wilson, CP24.com Police are investigating after a stabbing victim made his own way to a downtown trauma centre this morning. According to police, a male suffering from stab wounds walked into the hospital shortly after 7 a.m. It is unclear where the stabbing occurred. Police say officers are responding.",
                hypothesis: "A child in the midwest was hunted near Aurora, MN. He was caused to die by a member of his hunting party. It was not an accident.",
                targetLabel: 2,
                modelPrediction: [0.9979841709136963, 0.00018622813513502479, 0.0018295991467311978],
                labelExplanation: "While it is true that a child died in a non-accidental way near Aurora, MN and that the child (the 16 year old) was a member of a hunting party, he was not hunted by another member of his hunting party. He committed suicide.",
                modelExplanation: "I think the model was confused by the addition of some true statements (i.e., the child's death was not an accident). It also didn't correctly pick out the glaring false statement (i.e., that he was hunted and caused to die by a member of his hunting party).",
            },
            {
                passage: "Bat vocalization can be divided into two categories: echolocation and social calls, while the two types of calls are phonetically similar in that they are both syllabic in nature, they differ severely in their purpose, encoded information, and the response elicited from other bats.",
                hypothesis: "The different types of bat vocalization are easily distinguished by how they sound.",
                targetLabel: 2,
                modelPrediction: [0.0021961843594908714, 0.9938363432884216, 0.003967487718909979],
                labelExplanation: "The passage states that the two types of calls are phonetically similar, indicating that they are in fact NOT easily distinguishable by their sound.",
                modelExplanation: "The passage is long, has complex structure, and has a lot of words that do not appear in the statement. AI needs to understand that “similar” means NOT “easily distinguishable”. AI also needs to understand that “phonetically” and “by sound” mean the same thing.",
            },
            {
                passage: "Bat vocalization can be divided into two categories: echolocation and social calls, while the two types of calls are phonetically similar in that they are both syllabic in nature, they differ severely in their purpose, encoded information, and the response elicited from other bats.",
                hypothesis: "The types of bat calls are distinct.",
                targetLabel: 0,
                modelPrediction: [0.0009707773569971323, 0.0001817351731006056, 0.998847484588623],
                labelExplanation: "The passage states that the two types of calls “differ severely in their purpose, encoded information, and the response elicited from other bats”. This clearly indicates that the two types of calls are distinct.",
                modelExplanation: "AI might be wrong because the statement is short. The statement looks like a contradiction if the AI just focuses on the word “similar”, “both” in the passage. Also, the AI might not know that the word “distinct” means “recognizably different”.",
            },
        ]

        this.label_mappiing = {
            0: "definitely correct",
            1: "neither definitely correct nor definitely incorrect",
            2: "definitely incorrect",
        }
    }

    showExample = () => {
        const randomIndex = getRandomInt(this.data.length)
        this.setState({
            curExample: this.data[randomIndex],
            show: true
        })
        // console.log(this)
        // console.log(this.state)
        // randomly pick one example
    }

    render() {
        const showExampleButtonText = this.state.show ?  "Next Example" : "Show Example"
        const showExampleButton = <Button className="btn btn-primary btn-success" onClick={this.showExample}>{showExampleButtonText}</Button>
        const hideExampleButton = <Button className="btn btn-primary btn-success" onClick={() => this.setState({show: false, curExample: null})}>Hide Example</Button>

        let curExamplePanel = <div></div>
        if (this.state.curExample !== null) {
            curExamplePanel = <div className="card">
                <div className="card-body">
                    <div className="card-text">
                        <p>
                        <strong>Passage:</strong> <span style={{color: "blue"}}>{this.state.curExample.passage}</span>
                        </p>
                    </div>
                    <div className="card-text">
                        <p>
                        <strong>Statement:</strong> <span style={{color: "blue"}}>{this.state.curExample.hypothesis}</span>
                        </p>
                    </div>

                    <div className="card-text">
                        <p>
                        <strong>Given the passage, the statement is: </strong><span style={{backgroundColor: "coral"}}>{this.label_mappiing[this.state.curExample.targetLabel]}</span>
                        </p>
                    </div>
                    <div className="card-text">
                        <p>
                        Why the statement
                        is <span style={{backgroundColor: "coral"}}>{this.label_mappiing[this.state.curExample.targetLabel]}</span>?:<br /> <span style={{color: "green"}}><u>{this.state.curExample.labelExplanation}</u></span>
                        </p>
                    </div>

                </div>
                <div className="card-text text-muted">
                    The text in the <span style={{color: "blue"}}>blue</span> is what you will be provided in the HITs.<br />
                    The text in the <span style={{backgroundColor: "coral"}}>red</span> <u>is what we would like you to choose.</u><br />
                    Please follow the instructions in the HITs and give the responses accordingly.
                </div>
            </div>
        }

        return <React.Fragment>
            <h3>Get Help</h3>
            <div>Get help by clicking the "<strong>Show Example</strong>" below to see examples. We hope that the examples can help you understand the task and differentiate the categories you if you’re stumped.</div>
            {showExampleButton}&nbsp;&nbsp;{hideExampleButton}
            {curExamplePanel}
            </React.Fragment>
    }
}

export { ExampleGoodCards }
