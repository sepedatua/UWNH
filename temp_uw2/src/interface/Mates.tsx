import { useState, useMemo } from 'react';

import { getMates, getRoleDisplay } from '../state/selectors';
import { getPlayerFleet } from '../state/selectorsFleet';
import { assignMateRole, unassignMateRole } from '../game/port/tavernMates';
import { shipData } from '../data/shipData';
import MessageBox from './common/MessageBox';
import Menu from './common/Menu';
import Assets from '../assets';
import ProgressBar from './common/ProgressBar';
import { classNames } from './interfaceUtils';
import { sailorSkills } from '../data/sailorData';
import characterData from '../data/characterData';

export default function Mates() {
  const [tick, setTick] = useState(0);
  const [selectedI, setSelectedI] = useState(0);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const mates = useMemo(() => getMates(), [tick]);
  const fleet = getPlayerFleet();

  const currentMate = mates[selectedI] || mates[0];
  const {
    sailorId,
    role,
    name,
    age,
    stats,
    navigationLevel,
    battleLevel,
    skills,
  } = currentMate;

  const charInfo = characterData[sailorId] || { color: 'text-amber-950' };
  const color = charInfo.color;

  return (
    <MessageBox>
      <div className="flex relative">
        <div className="w-[280px]">
          <Menu
            options={mates.map((mate, i) => ({
              label: mate.name,
              value: i,
            }))}
            onSelect={() => {}}
            onActiveIndex={setSelectedI}
          />
        </div>
        <div className="relative text-black text-2xl p-8 flex-1">
          <div className="flex items-center">
            <img
              src={Assets.characters(sailorId)}
              className="w-32 h-40 object-cover rounded border-2 border-[#8c6f4b] shadow-sm bg-[#dfcfbd]"
              alt=""
            />
            <div className="pl-8 flex-1">
              <div className={classNames('text-4xl font-bold', color)}>
                {name}
              </div>
              <div className="text-lg text-gray-500">Age {age}</div>
              <div className="mt-3">
                <div className="font-semibold text-xl text-[#2a170a]">
                  {selectedI === 0 ? '👑 ' : ''}
                  {getRoleDisplay(role) || 'Reserve Navigator'}
                </div>

                {selectedI !== 0 ? (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowRoleModal(true)}
                      className="px-3 py-1 rounded text-xs font-sans font-bold cursor-pointer transition-all border bg-amber-800 hover:bg-amber-900 border-amber-950 text-amber-100 shadow flex items-center gap-1.5"
                    >
                      <span>⚙️</span>
                      <span>Assign Duty / Post</span>
                    </button>
                    {role !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          unassignMateRole(sailorId);
                          setTick((t) => t + 1);
                        }}
                        className="px-2.5 py-1 rounded text-xs font-sans font-semibold cursor-pointer transition-all border bg-[#ece0d1] hover:bg-[#d8c2aa] border-[#8c6f4b] text-neutral-800"
                      >
                        Relieve of Duty
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-amber-900 font-sans font-semibold mt-1">
                    Fleet Commodore (Supreme Flagship Commander)
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-1">Loyal to Portugal</div>
              </div>
            </div>
          </div>
          <div className="flex mt-8">
            <div className="w-72 mr-8 pr-8 space-y-8">
              {sailorId === '1' && (
                <div className="flex justify-between">
                  <div>Rank</div>
                  <div>None</div>
                </div>
              )}
              {sailorId !== '1' && (
                <div className="flex justify-between">
                  <div>Wages</div>
                  <div>10</div>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div>Navigation Level</div>
                    <div>{navigationLevel}</div>
                  </div>
                  <div className="flex items-center justify-between text-gray-500 text-lg mt-2 pl-4">
                    <div>Experience</div>
                    <div>0</div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <div>Battle Level</div>
                    <div>{battleLevel}</div>
                  </div>
                  <div className="flex items-center justify-between text-gray-500 text-lg mt-2 pl-4">
                    <div>Experience</div>
                    <div>0</div>
                  </div>
                </div>
              </div>
              <div>
                <div>Skills</div>
                <div className="space-y-2 pl-4 text-lg mt-2">
                  {sailorSkills.map((skill) => (
                    <div
                      className={classNames(
                        'capitalize',
                        skills.includes(skill)
                          ? 'text-orange-700 font-bold'
                          : 'text-orange-200',
                      )}
                      key={skill}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {Object.entries(stats)
                .filter(([key]) => key !== 'luck')
                .map(([key, value]) => (
                  <div
                    className="w-56 flex items-center justify-between"
                    key={key}
                  >
                    <div className="w-36">
                      <div className="text-lg capitalize mb-2">{key}</div>
                      <ProgressBar percent={value} />
                    </div>
                    <div className="flex text-right">{value}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Duty / Post Assignment Modal */}
        {showRoleModal && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-[580px] max-h-[520px] bg-[#f4ebe1] border-2 border-[#8c6f4b] rounded-xl shadow-2xl flex flex-col overflow-hidden font-mono text-black">
              {/* Header */}
              <div className="bg-[#e2d0bd] border-b border-[#bfa384] px-4 py-2.5 flex justify-between items-center">
                <div className="font-bold text-base text-[#2c1708] flex items-center gap-2">
                  <span>📜</span>
                  <span>Assign Duty / Post for {name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="text-neutral-600 hover:text-black font-bold px-2 py-0.5 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4 text-xs">
                {/* 1. Consort Ships */}
                <div>
                  <div className="font-bold text-amber-950 mb-2 flex items-center gap-1.5 border-b border-[#c8b29b] pb-1">
                    <span>⛵</span>
                    <span>Consort Ship Captains</span>
                  </div>
                  {fleet.length <= 1 ? (
                    <div className="text-neutral-500 italic pl-2 py-1">
                      No consort vessels in fleet. Purchase or capture ships at the Shipyard to appoint captains.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5">
                      {fleet.slice(1).map((ship, consortIdx) => {
                        const shipRoleIndex = consortIdx + 1;
                        const currentHolder = mates.find((m) => m.role === shipRoleIndex);
                        const isSelectedForThis = role === shipRoleIndex;

                        return (
                          <button
                            key={ship.name + shipRoleIndex}
                            type="button"
                            onClick={() => {
                              assignMateRole(sailorId, shipRoleIndex);
                              setShowRoleModal(false);
                              setTick((t) => t + 1);
                            }}
                            className={`w-full text-left p-2.5 rounded border flex items-center justify-between transition-all cursor-pointer ${
                              isSelectedForThis
                                ? 'bg-amber-800 text-amber-100 border-amber-950 font-bold'
                                : 'bg-[#faf3eb] hover:bg-[#ebdcc9] text-neutral-800 border-[#caa98a]'
                            }`}
                          >
                            <div>
                              <div className="font-bold">
                                Ship #{shipRoleIndex + 1}: {ship.name}
                              </div>
                              <div className="text-[10px] text-neutral-600">
                                {ship.crew} crew • {shipData[ship.id]?.name || 'Vessel'}
                              </div>
                            </div>
                            <div className="text-[11px] font-semibold">
                              {isSelectedForThis ? (
                                <span className="text-yellow-300">★ Current Captain</span>
                              ) : currentHolder ? (
                                <span className="text-neutral-600">Held by {currentHolder.name}</span>
                              ) : (
                                <span className="text-emerald-700 font-bold">✨ Vacant Post</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Bridge Officers */}
                <div>
                  <div className="font-bold text-amber-950 mb-2 flex items-center gap-1.5 border-b border-[#c8b29b] pb-1">
                    <span>⚓</span>
                    <span>Flagship Bridge Officers</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      {
                        roleKey: 'firstMate' as const,
                        title: 'First Mate',
                        desc: 'Fleet second-in-command; delivers harbor & voyage readiness briefings',
                        icon: '⚓',
                      },
                      {
                        roleKey: 'chiefNavigator' as const,
                        title: 'Chief Navigator',
                        desc: 'Master of sextants and charts; maintains celestial coordinates',
                        icon: '🧭',
                      },
                      {
                        roleKey: 'bookKeeper' as const,
                        title: 'Bookkeeper',
                        desc: 'Financial accountant; manages market price trends and tariff records',
                        icon: '💰',
                      },
                      {
                        roleKey: 'lookout' as const,
                        title: 'Chief Lookout',
                        desc: 'Crow’s nest watch officer; expands horizon to spot villages & reefs',
                        icon: '🔭',
                      },
                    ].map(({ roleKey, title, desc, icon }) => {
                      const currentHolder = mates.find((m) => m.role === roleKey);
                      const isSelectedForThis = role === roleKey;

                      return (
                        <button
                          key={roleKey}
                          type="button"
                          onClick={() => {
                            assignMateRole(sailorId, roleKey);
                            setShowRoleModal(false);
                            setTick((t) => t + 1);
                          }}
                          className={`w-full text-left p-2.5 rounded border flex items-center justify-between transition-all cursor-pointer ${
                            isSelectedForThis
                              ? 'bg-amber-800 text-amber-100 border-amber-950 font-bold'
                              : 'bg-[#faf3eb] hover:bg-[#ebdcc9] text-neutral-800 border-[#caa98a]'
                          }`}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{icon}</span>
                              <span>{title}</span>
                            </div>
                            <div className="text-[10px] text-neutral-600">{desc}</div>
                          </div>
                          <div className="text-[11px] font-semibold">
                            {isSelectedForThis ? (
                              <span className="text-yellow-300">★ Current Post</span>
                            ) : currentHolder ? (
                              <span className="text-neutral-600">Held by {currentHolder.name}</span>
                            ) : (
                              <span className="text-emerald-700 font-bold">✨ Vacant Post</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Reserve / Passenger */}
                <div>
                  <div className="font-bold text-amber-950 mb-2 flex items-center gap-1.5 border-b border-[#c8b29b] pb-1">
                    <span>💤</span>
                    <span>Reserve / Passenger</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      unassignMateRole(sailorId);
                      setShowRoleModal(false);
                      setTick((t) => t + 1);
                    }}
                    className={`w-full text-left p-2.5 rounded border flex items-center justify-between transition-all cursor-pointer ${
                      role === null
                        ? 'bg-neutral-800 text-neutral-100 border-neutral-950 font-bold'
                        : 'bg-[#faf3eb] hover:bg-[#ebdcc9] text-neutral-800 border-[#caa98a]'
                    }`}
                  >
                    <div>
                      <div className="font-bold">Reserve Navigator</div>
                      <div className="text-[10px] text-neutral-600">
                        Off-duty passenger awaiting fleet assignment
                      </div>
                    </div>
                    <div className="text-[11px] font-semibold">
                      {role === null ? (
                        <span className="text-yellow-300">★ Current Status</span>
                      ) : (
                        <span className="text-neutral-500">Relieve of Duty</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-[#e2d0bd] border-t border-[#bfa384] px-4 py-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-1.5 bg-[#d4c1ab] hover:bg-[#c5b098] border border-[#8c6f4b] rounded text-xs font-bold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MessageBox>
  );
}
